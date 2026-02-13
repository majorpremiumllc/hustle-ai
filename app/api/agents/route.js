/**
 * HustleAI — Agents API
 * GET: list agents with status
 * POST: trigger an agent manually
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — List all agents with status
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ agents: [] });

    // Import dynamically to avoid module resolution issues
    const { getAgentStatuses } = require("@/lib/agents/engine");
    const agents = await getAgentStatuses(companyId);

    // Get aggregate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalRunsToday = await prisma.agentRun.count({
        where: { companyId, startedAt: { gte: today } },
    });

    const emailsToday = await prisma.emailLog.count({
        where: { companyId, createdAt: { gte: today } },
    });

    return NextResponse.json({
        agents,
        stats: {
            totalRunsToday,
            emailsToday,
        },
    });
}

// POST — Trigger an agent
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { agent } = await request.json();
    if (!agent) return NextResponse.json({ error: "agent is required" }, { status: 400 });

    const validAgents = ["market-scanner", "email-outreach", "sms-outreach", "cold-caller", "lead-nurture"];
    if (!validAgents.includes(agent)) {
        return NextResponse.json({ error: `Invalid agent. Valid: ${validAgents.join(", ")}` }, { status: 400 });
    }

    // Execute agent (don't await — run in background)
    const { executeAgent } = require("@/lib/agents/engine");

    // Start execution, but return immediately
    const resultPromise = executeAgent(companyId, agent);

    // Wait a short time to capture immediate errors
    const result = await Promise.race([
        resultPromise,
        new Promise((resolve) => setTimeout(() => resolve({ status: "running", agent }), 15000)),
    ]);

    return NextResponse.json(result);
}
