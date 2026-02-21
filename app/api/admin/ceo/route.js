/**
 * HustleAI — CEO Command Center API
 * 
 * GET /api/admin/ceo
 * 
 * Returns all data needed for the CEO dashboard:
 * - Overview metrics (revenue, clients, leads, SMS, AI responses)
 * - Client grid (all clients with health status)
 * - Live feed (recent messages/events)
 * - Risk monitor (alerts, failures, rate limits)
 * - Override capabilities
 */

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getGatewayStatus } from "@/lib/twilio-gateway";
import { getAIMetrics } from "@/lib/ai-router";

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ═══ 1. OVERVIEW METRICS ═══
    const [
        totalClients,
        activeClients,
        totalLeads,
        leadsThisWeek,
        totalMessages,
        messagesThisWeek,
        totalCalls,
        activeSubscriptions,
    ] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { onboardingDone: true } }),
        prisma.lead.count(),
        prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.conversation.count(),
        prisma.conversation.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.callLog.count().catch(() => 0),
        prisma.subscription.count({ where: { status: { in: ["active", "trialing"] } } }),
    ]);

    // AI metrics from provider router
    const aiMetrics = getAIMetrics();

    const overview = {
        clients: { total: totalClients, active: activeClients },
        leads: { total: totalLeads, thisWeek: leadsThisWeek },
        messages: { total: totalMessages, thisWeek: messagesThisWeek },
        calls: { total: totalCalls },
        subscriptions: { active: activeSubscriptions },
        ai: {
            totalRequests: aiMetrics.total,
            byProvider: aiMetrics.byProvider,
            fallbackRate: aiMetrics.fallbackRate,
            avgLatencyMs: aiMetrics.avgLatencyMs,
        },
        uptime: process.uptime(),
        timestamp: now.toISOString(),
    };

    // ═══ 2. CLIENT GRID ═══
    const companies = await prisma.company.findMany({
        include: {
            subscription: true,
            phoneNumbers: { select: { number: true, campaignStatus: true, active: true } },
            _count: { select: { leads: true, conversations: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const clientGrid = companies.map((c) => {
        const sub = c.subscription;
        const phones = c.phoneNumbers || [];
        const tenDlcStatus = phones.length > 0
            ? phones.every(p => p.campaignStatus === "approved") ? "approved"
                : phones.some(p => p.campaignStatus === "pending") ? "pending"
                    : "not-registered"
            : "no-number";

        return {
            id: c.id,
            name: c.name,
            industry: c.industry || "unknown",
            phone: phones[0]?.number || null,
            subscription: {
                plan: sub?.plan || "none",
                status: sub?.status || "none",
                expiresAt: sub?.currentPeriodEnd || null,
            },
            stats: {
                leads: c._count.leads,
                messages: c._count.conversations,
            },
            health: {
                tenDlc: tenDlcStatus,
                aiActive: !!c.aiTone && c.aiTone !== "paused",
                missedCallTextBack: c.missedCallTextBack,
                smsEnabled: phones.some(p => p.active),
            },
            onboardingDone: c.onboardingDone,
            createdAt: c.createdAt,
        };
    });

    // ═══ 3. LIVE FEED ═══
    const recentConversations = await prisma.conversation.findMany({
        take: 20,
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            customerNumber: true,
            lastMessage: true,
            lastAiReply: true,
            status: true,
            updatedAt: true,
            company: { select: { name: true } },
        },
    });

    const recentLeads = await prisma.lead.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            phone: true,
            source: true,
            createdAt: true,
            company: { select: { name: true } },
        },
    });

    const liveFeed = {
        messages: recentConversations.map(c => ({
            id: c.id,
            client: c.company?.name || "Unknown",
            customer: c.customerNumber,
            lastMessage: c.lastMessage?.substring(0, 100),
            aiReply: c.lastAiReply?.substring(0, 100),
            status: c.status,
            time: c.updatedAt,
        })),
        leads: recentLeads.map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            source: l.source,
            client: l.company?.name || "Unknown",
            time: l.createdAt,
        })),
    };

    // ═══ 4. RISK MONITOR ═══
    const alerts = [];

    // Check for expired subscriptions
    const expiredSubs = await prisma.subscription.findMany({
        where: {
            OR: [
                { status: "past_due" },
                { status: "canceled" },
                { currentPeriodEnd: { lt: now } },
            ],
        },
        include: { company: { select: { name: true } } },
    });
    for (const sub of expiredSubs) {
        alerts.push({
            level: "warning",
            type: "subscription_expired",
            message: `${sub.company.name} — subscription ${sub.status}`,
            companyId: sub.companyId,
        });
    }

    // Check for unregistered 10DLC
    const unregisteredPhones = await prisma.phoneNumber.findMany({
        where: { campaignStatus: { in: ["not-registered", "rejected"] }, active: true },
        include: { company: { select: { name: true } } },
    });
    for (const pn of unregisteredPhones) {
        alerts.push({
            level: pn.campaignStatus === "rejected" ? "critical" : "warning",
            type: "10dlc_not_registered",
            message: `${pn.company.name} — ${pn.number} 10DLC: ${pn.campaignStatus}`,
            companyId: pn.companyId,
        });
    }

    // Check compliance logs for failures (last 24h)
    try {
        const complianceFails = await prisma.complianceLog.count({
            where: {
                type: "violation",
                createdAt: { gte: today },
            },
        });
        if (complianceFails > 0) {
            alerts.push({
                level: "critical",
                type: "compliance_violations",
                message: `${complianceFails} compliance violations today`,
            });
        }
    } catch (e) { /* ComplianceLog may not exist yet */ }

    // Gateway status
    const gateway = getGatewayStatus();

    if (gateway.projectThrottle.remaining < 10) {
        alerts.push({
            level: "critical",
            type: "project_throttle_near_limit",
            message: `Project throttle: ${gateway.projectThrottle.used}/${gateway.projectThrottle.limit} — only ${gateway.projectThrottle.remaining} remaining`,
        });
    }

    // AI provider health
    if (aiMetrics.providers.gemini.status === "degraded") {
        alerts.push({ level: "critical", type: "gemini_degraded", message: `Gemini degraded — ${aiMetrics.failures.gemini} failures, using fallback chain` });
    }
    if (!process.env.GEMINI_API_KEY) {
        alerts.push({ level: "critical", type: "gemini_not_configured", message: "GEMINI_API_KEY not set" });
    }
    if (!process.env.ENCRYPTION_KEY) {
        alerts.push({ level: "critical", type: "encryption_missing", message: "ENCRYPTION_KEY not configured" });
    }

    const riskMonitor = {
        alerts,
        gateway,
        aiProviders: aiMetrics.providers,
        aiFailures: aiMetrics.failures,
        systemHealth: {
            gemini: aiMetrics.providers.gemini.status,
            openai: aiMetrics.providers.openai.status,
            templateEngine: "always-on",
            encryption: process.env.ENCRYPTION_KEY ? "ok" : "missing",
            adminAuth: process.env.ADMIN_API_KEY ? "ok" : "missing",
        },
    };

    // ═══ 5. OVERRIDE STATUS ═══
    // (Overrides are applied via PATCH /api/admin/ceo)
    const overrides = {
        available: [
            { action: "pause_ai", description: "Pause AI responses for a client (fallback to static message)" },
            { action: "disable_outbound", description: "Block all outbound SMS for a client" },
            { action: "force_fallback", description: "Force all clients to fallback mode" },
            { action: "disable_client", description: "Fully disable a client's service" },
        ],
    };

    return Response.json({
        overview,
        clientGrid,
        liveFeed,
        riskMonitor,
        overrides,
    });
}

// ═══ PATCH: Apply Override ═══
export async function PATCH(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { action, companyId, value } = await request.json();

    if (!action) {
        return Response.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
        case "pause_ai": {
            if (!companyId) return Response.json({ error: "companyId required" }, { status: 400 });
            await prisma.company.update({
                where: { id: companyId },
                data: { aiTone: value === false ? null : "paused" },
            });
            return Response.json({ success: true, action, companyId, paused: value !== false });
        }

        case "disable_outbound": {
            if (!companyId) return Response.json({ error: "companyId required" }, { status: 400 });
            await prisma.phoneNumber.updateMany({
                where: { companyId },
                data: { active: value !== false ? false : true },
            });
            return Response.json({ success: true, action, companyId, disabled: value !== false });
        }

        case "disable_client": {
            if (!companyId) return Response.json({ error: "companyId required" }, { status: 400 });
            await prisma.company.update({
                where: { id: companyId },
                data: { onboardingDone: value !== false ? false : true },
            });
            await prisma.subscription.updateMany({
                where: { companyId },
                data: { status: value !== false ? "canceled" : "active" },
            });
            return Response.json({ success: true, action, companyId, disabled: value !== false });
        }

        default:
            return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
}
