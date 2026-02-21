/**
 * HustleAI — Pilot Client Monitor API
 * Live feed of inbound messages, AI replies, delivery status,
 * and lead capture for pilot monitoring.
 * 
 * /admin/client-monitor fetches this data.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getComplianceScore } from "@/lib/compliance";
import { getClientTelecomHealth } from "@/lib/telecom-health";

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    try {
        // If no clientId, return all clients summary
        if (!clientId) {
            const companies = await prisma.company.findMany({
                include: {
                    subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
                    phoneNumbers: { select: { number: true, campaignStatus: true } },
                    _count: { select: { leads: true, conversations: true, callLogs: true } },
                },
                orderBy: { createdAt: "desc" },
            });

            return NextResponse.json({
                clients: companies.map(c => ({
                    id: c.id,
                    name: c.name,
                    industry: c.industry,
                    phone: c.phoneNumbers[0]?.number || c.phone,
                    plan: c.subscription?.plan || "none",
                    status: c.subscription?.status || "inactive",
                    trialExpires: c.subscription?.currentPeriodEnd?.toISOString(),
                    tenDlc: c.phoneNumbers[0]?.campaignStatus || "not-registered",
                    stats: c._count,
                    createdAt: c.createdAt.toISOString(),
                })),
            });
        }

        // Detailed monitor for a specific client
        const company = await prisma.company.findUnique({
            where: { id: clientId },
            include: { phoneNumbers: true, subscription: true },
        });

        if (!company) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Recent conversations with messages
        const conversations = await prisma.conversation.findMany({
            where: { companyId: clientId },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        // Recent leads
        const leads = await prisma.lead.findMany({
            where: { companyId: clientId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Recent call logs
        const calls = await prisma.callLog.findMany({
            where: { companyId: clientId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Compliance logs (last 24h)
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const complianceLogs = await prisma.complianceLog.findMany({
            where: { companyId: clientId, createdAt: { gte: since24h } },
            orderBy: { createdAt: "desc" },
        });

        // Metrics
        const compliance = await getComplianceScore(clientId);
        const health = await getClientTelecomHealth(clientId);

        // Format message feed
        const messageFeed = [];
        for (const convo of conversations) {
            for (const msg of convo.messages) {
                messageFeed.push({
                    conversationId: convo.id,
                    phone: convo.phone,
                    direction: msg.role === "user" ? "inbound" : "outbound",
                    content: msg.content,
                    timestamp: msg.createdAt.toISOString(),
                    aiGenerated: msg.role === "assistant",
                });
            }
        }
        // Sort by time descending
        messageFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return NextResponse.json({
            client: {
                id: company.id,
                name: company.name,
                industry: company.industry,
                phone: company.phoneNumbers[0]?.number || company.phone,
                plan: company.subscription?.plan,
                status: company.subscription?.status,
                trialExpires: company.subscription?.currentPeriodEnd?.toISOString(),
                tenDlcStatus: company.phoneNumbers[0]?.campaignStatus || "not-registered",
            },
            feed: messageFeed.slice(0, limit),
            leads: leads.map(l => ({
                id: l.id,
                name: l.customerName,
                phone: l.customerPhone,
                source: l.source,
                status: l.status,
                jobType: l.jobType,
                notes: l.notes,
                createdAt: l.createdAt.toISOString(),
            })),
            calls: calls.map(c => ({
                sid: c.callSid,
                from: c.callerPhone,
                status: c.status,
                duration: c.duration,
                timestamp: c.createdAt.toISOString(),
            })),
            complianceLogs: complianceLogs.map(l => ({
                event: l.event,
                phone: l.phone,
                details: l.details,
                timestamp: l.createdAt.toISOString(),
            })),
            metrics: {
                complianceScore: compliance.score,
                complianceDetails: compliance.details,
                telecomHealth: health.summary,
                alerts: health.alerts,
            },
        });
    } catch (err) {
        console.error("[Monitor] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
