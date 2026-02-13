/**
 * HustleAI — Agent Autostart API
 * GET: starts the autonomous scheduler + returns status
 * POST: control scheduler (start/stop/status)
 */

import { NextResponse } from "next/server";

let schedulerRef = null;

function getScheduler() {
    if (!schedulerRef) {
        schedulerRef = require("@/lib/agents/auto-scheduler");
    }
    return schedulerRef;
}

// GET — Start scheduler and return status
export async function GET() {
    const scheduler = getScheduler();
    const startResult = scheduler.start();
    const status = scheduler.getStatus();

    return NextResponse.json({
        ...startResult,
        ...status,
        message: "Autonomous scheduler is active. Agents run automatically on their intervals.",
    });
}

// POST — Control scheduler
export async function POST(request) {
    const { action } = await request.json();
    const scheduler = getScheduler();

    switch (action) {
        case "start":
            return NextResponse.json(scheduler.start());
        case "stop":
            return NextResponse.json(scheduler.stop());
        case "status":
            return NextResponse.json(scheduler.getStatus());
        default:
            return NextResponse.json({ error: "action must be start|stop|status" }, { status: 400 });
    }
}
