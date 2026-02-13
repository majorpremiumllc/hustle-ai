/**
 * HustleAI — Dashboard Stats API
 * Returns aggregated stats from Prisma for the dashboard overview page.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";

export async function GET() {
    // Get company from session or fallback to first company (single-tenant)
    let companyId = null;
    try {
        const session = await getServerSession(authOptions);
        companyId = session?.user?.companyId;
    } catch (e) { /* session unavailable — webhooks/cron */ }

    if (!companyId) {
        const company = await prisma.company.findFirst();
        if (!company) {
            return Response.json({
                totalLeads: 0,
                callsAnswered: 0,
                messagesSent: 0,
                conversionRate: 0,
                leadsUsed: 0,
                leadsLimit: 0,
                plan: "starter",
                recentActivity: [],
            });
        }
        companyId = company.id;
    }

    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
        where: { companyId },
    });
    const plan = subscription?.plan || "starter";
    const limits = getPlanLimits(plan);

    // Aggregate stats
    const [totalLeads, calls, conversations, bookedLeads] = await Promise.all([
        prisma.lead.count({ where: { companyId } }),
        prisma.callLog.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
        prisma.conversation.findMany({
            where: { companyId, channel: "sms" },
            include: { messages: { where: { role: "assistant" } } },
            orderBy: { updatedAt: "desc" },
            take: 50,
        }),
        prisma.lead.count({
            where: {
                companyId,
                status: { in: ["booked", "estimate_scheduled", "completed"] },
            },
        }),
    ]);

    const callsAnswered = calls.filter((c) => c.status === "completed").length;
    const messagesSent = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

    // Leads used in current period
    let leadsUsed = 0;
    if (subscription) {
        leadsUsed = await prisma.lead.count({
            where: {
                companyId,
                createdAt: { gte: subscription.currentPeriodStart },
            },
        });
    }

    // Recent activity
    const recentActivity = [];

    calls.slice(0, 5).forEach((c) => {
        let transcript = [];
        try { transcript = JSON.parse(c.transcript || "[]"); } catch (e) { /* */ }

        recentActivity.push({
            type: "call",
            title: `Call from ${c.callerPhone}`,
            meta: c.summary || c.status || "—",
            time: c.createdAt.toISOString(),
        });
    });

    conversations.slice(0, 5).forEach((c) => {
        const lastMsg = c.messages[c.messages.length - 1];
        const preview = lastMsg?.content?.slice(0, 60) || "New conversation";
        recentActivity.push({
            type: "sms",
            title: `SMS with ${c.phone}`,
            meta: preview + (lastMsg?.content?.length > 60 ? "…" : ""),
            time: c.updatedAt.toISOString(),
        });
    });

    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

    return Response.json({
        totalLeads,
        callsAnswered,
        messagesSent,
        conversionRate,
        leadsUsed,
        leadsLimit: limits.leadsPerMonth === Infinity ? "unlimited" : limits.leadsPerMonth,
        plan,
        planName: limits.name,
        recentActivity: recentActivity.slice(0, 8),
    });
}
