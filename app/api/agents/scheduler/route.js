/**
 * HustleAI — Agent Scheduler (Cron endpoint)
 * Call this endpoint periodically to run agents on their schedules.
 * Works with Vercel Cron, Railway Cron, or external cron services.
 *
 * GET /api/agents/scheduler — runs all due agents
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const AGENT_SCHEDULE = [
    { id: "market-scanner", intervalMs: 6 * 60 * 60 * 1000 }, // 6 hours
    { id: "email-outreach", intervalMs: 30 * 60 * 1000 },      // 30 minutes
    { id: "sms-outreach", intervalMs: 30 * 60 * 1000 },        // 30 minutes
    { id: "lead-nurture", intervalMs: 24 * 60 * 60 * 1000 },   // 24 hours
    // cold-caller is manual only
];

export async function GET(request) {
    // Optional auth via secret header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow localhost without auth
        const url = new URL(request.url);
        if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const company = await prisma.company.findFirst();
    if (!company) return NextResponse.json({ error: "No company found" }, { status: 404 });

    const companyId = company.id;
    const { executeAgent } = require("@/lib/agents/engine");
    const results = [];

    for (const schedule of AGENT_SCHEDULE) {
        // Check last run
        const lastRun = await prisma.agentRun.findFirst({
            where: { companyId, agent: schedule.id, status: "success" },
            orderBy: { startedAt: "desc" },
        });

        const lastRunTime = lastRun ? new Date(lastRun.startedAt).getTime() : 0;
        const timeSinceLastRun = Date.now() - lastRunTime;

        if (timeSinceLastRun >= schedule.intervalMs) {
            console.log(`[Scheduler] Running ${schedule.id} (${Math.round(timeSinceLastRun / 60000)}min since last run)`);
            const result = await executeAgent(companyId, schedule.id);
            results.push(result);
        } else {
            const nextRunIn = Math.round((schedule.intervalMs - timeSinceLastRun) / 60000);
            results.push({ agent: schedule.id, status: "skipped", nextRunInMinutes: nextRunIn });
        }
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        companyId,
        results,
    });
}
