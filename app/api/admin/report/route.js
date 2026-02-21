/**
 * HustleAI — Value Proof Metrics & Weekly Report
 * Tracks pilot client ROI: missed calls recovered, response rates,
 * AI engagement, and average reply time.
 * 
 * GET /api/admin/report?clientId=xxx         → Client metrics
 * GET /api/admin/report?clientId=xxx&weekly=1 → Weekly report
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const weekly = searchParams.get("weekly") === "1";
    const days = parseInt(searchParams.get("days") || "7", 10);

    if (!clientId) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: clientId } });
    if (!company) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ── Missed Calls Recovered ──
    const missedCalls = await prisma.callLog.count({
        where: {
            companyId: clientId,
            status: { in: ["no-answer", "busy", "canceled"] },
            createdAt: { gte: since },
        },
    });

    const totalCalls = await prisma.callLog.count({
        where: { companyId: clientId, createdAt: { gte: since } },
    });

    // Leads created from missed calls
    const missedCallLeads = await prisma.lead.count({
        where: {
            companyId: clientId,
            source: "Missed Call",
            createdAt: { gte: since },
        },
    });

    // ── SMS Response Metrics ──
    const conversations = await prisma.conversation.findMany({
        where: { companyId: clientId, channel: "sms", createdAt: { gte: since } },
        include: {
            messages: { orderBy: { createdAt: "asc" } },
        },
    });

    let totalInbound = 0;
    let totalOutbound = 0;
    let totalResponseTimeMs = 0;
    let responseCount = 0;
    let bookingsDetected = 0;

    for (const convo of conversations) {
        const msgs = convo.messages;
        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].role === "user") {
                totalInbound++;
                // Find next assistant message to calculate response time
                if (i + 1 < msgs.length && msgs[i + 1].role === "assistant") {
                    const responseTime = new Date(msgs[i + 1].createdAt) - new Date(msgs[i].createdAt);
                    totalResponseTimeMs += responseTime;
                    responseCount++;
                }
            } else if (msgs[i].role === "assistant") {
                totalOutbound++;
                if (/booking confirmed/i.test(msgs[i].content)) {
                    bookingsDetected++;
                }
            }
        }
    }

    const avgResponseTimeSec = responseCount > 0 ? Math.round(totalResponseTimeMs / responseCount / 1000) : 0;
    const responseRate = totalInbound > 0 ? Math.round((responseCount / totalInbound) * 100) : 0;

    // ── Lead Metrics ──
    const totalLeads = await prisma.lead.count({
        where: { companyId: clientId, createdAt: { gte: since } },
    });

    const smsLeads = await prisma.lead.count({
        where: { companyId: clientId, source: "SMS", createdAt: { gte: since } },
    });

    const scheduledLeads = await prisma.lead.count({
        where: { companyId: clientId, status: "estimate_scheduled", createdAt: { gte: since } },
    });

    // ── AI Engagement Rate ──
    // Engagement = conversations with 3+ messages from customer
    const engagedConvos = conversations.filter(c =>
        c.messages.filter(m => m.role === "user").length >= 3
    ).length;
    const engagementRate = conversations.length > 0
        ? Math.round((engagedConvos / conversations.length) * 100)
        : 0;

    const metrics = {
        period: {
            days,
            from: since.toISOString(),
            to: new Date().toISOString(),
        },
        callMetrics: {
            totalCalls,
            missedCalls,
            missedCallsRecovered: missedCallLeads,
            recoveryRate: missedCalls > 0 ? Math.round((missedCallLeads / missedCalls) * 100) : 0,
        },
        smsMetrics: {
            totalConversations: conversations.length,
            inboundMessages: totalInbound,
            outboundMessages: totalOutbound,
            responseRate,
            avgResponseTimeSec,
            bookingsDetected,
        },
        leadMetrics: {
            totalLeads,
            fromSms: smsLeads,
            fromMissedCalls: missedCallLeads,
            estimatesScheduled: scheduledLeads,
            conversionRate: totalLeads > 0 ? Math.round((scheduledLeads / totalLeads) * 100) : 0,
        },
        aiEngagement: {
            totalConversations: conversations.length,
            engagedConversations: engagedConvos,
            engagementRate,
        },
    };

    if (weekly) {
        // Format as weekly report text
        const report = generateWeeklyReport(company, metrics);
        return NextResponse.json({ report, metrics });
    }

    return NextResponse.json({ client: company.name, metrics });
}

function generateWeeklyReport(company, m) {
    return `
═══════════════════════════════════════════
  WEEKLY AI FRONT DESK REPORT
  ${company.name}
  ${m.period.from.split("T")[0]} → ${m.period.to.split("T")[0]}
═══════════════════════════════════════════

📞 CALLS
  Total calls: ${m.callMetrics.totalCalls}
  Missed calls: ${m.callMetrics.missedCalls}
  Recovered via text-back: ${m.callMetrics.missedCallsRecovered}
  Recovery rate: ${m.callMetrics.recoveryRate}%

💬 SMS AI ASSISTANT
  Conversations: ${m.smsMetrics.totalConversations}
  Inbound messages: ${m.smsMetrics.inboundMessages}
  AI responses sent: ${m.smsMetrics.outboundMessages}
  Response rate: ${m.smsMetrics.responseRate}%
  Avg response time: ${m.smsMetrics.avgResponseTimeSec}s
  Bookings detected: ${m.smsMetrics.bookingsDetected}

🎯 LEADS
  Total new leads: ${m.leadMetrics.totalLeads}
  From SMS: ${m.leadMetrics.fromSms}
  From missed calls: ${m.leadMetrics.fromMissedCalls}
  Estimates scheduled: ${m.leadMetrics.estimatesScheduled}
  Conversion rate: ${m.leadMetrics.conversionRate}%

🤖 AI ENGAGEMENT
  Total conversations: ${m.aiEngagement.totalConversations}
  Engaged (3+ messages): ${m.aiEngagement.engagedConversations}
  Engagement rate: ${m.aiEngagement.engagementRate}%

═══════════════════════════════════════════
  Generated by HustleAI on ${new Date().toISOString().split("T")[0]}
═══════════════════════════════════════════
`.trim();
}
