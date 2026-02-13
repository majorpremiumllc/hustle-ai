/**
 * HustleAI — Auto-Scheduler
 * Self-running background loop that executes agents on their intervals.
 * Starts automatically when the server boots.
 */

let isRunning = false;
let intervalId = null;

const SCHEDULE = [
    { id: "market-scanner", intervalMs: 6 * 60 * 60 * 1000, label: "6h" },
    { id: "email-outreach", intervalMs: 30 * 60 * 1000, label: "30m" },
    { id: "sms-outreach", intervalMs: 30 * 60 * 1000, label: "30m" },
    { id: "lead-nurture", intervalMs: 24 * 60 * 60 * 1000, label: "24h" },
    // cold-caller is manual only
];

// Track last run times in memory (also checked from DB)
const lastRunTimes = {};

async function runSchedulerCycle() {
    if (!isRunning) return;

    try {
        // Dynamic import to avoid circular deps
        const prismaModule = require("../prisma");
        const prisma = prismaModule.default || prismaModule;
        const { executeAgent } = require("./engine");

        const company = await prisma.company.findFirst();
        if (!company) {
            console.log("[AutoScheduler] No company found, skipping cycle");
            return;
        }

        const companyId = company.id;
        const now = Date.now();

        for (const sched of SCHEDULE) {
            const lastRun = lastRunTimes[sched.id] || 0;
            const timeSince = now - lastRun;

            if (timeSince >= sched.intervalMs) {
                // Check DB for last successful run too (in case of server restart)
                const dbLastRun = await prisma.agentRun.findFirst({
                    where: { companyId, agent: sched.id, status: "success" },
                    orderBy: { startedAt: "desc" },
                });

                const dbTimeSince = dbLastRun
                    ? now - new Date(dbLastRun.startedAt).getTime()
                    : Infinity;

                if (dbTimeSince >= sched.intervalMs) {
                    console.log(`[AutoScheduler] ▶ Running ${sched.id} (${sched.label} interval)`);

                    try {
                        await executeAgent(companyId, sched.id);
                        lastRunTimes[sched.id] = Date.now();
                    } catch (err) {
                        console.error(`[AutoScheduler] ❌ ${sched.id} error:`, err.message);

                        // If quota error, wait longer before retrying
                        if (err.message?.includes("429") || err.message?.includes("quota")) {
                            console.log(`[AutoScheduler] ⏳ Quota hit, delaying ${sched.id} by 5 min`);
                            lastRunTimes[sched.id] = Date.now() - sched.intervalMs + 5 * 60 * 1000;
                        }
                    }

                    // Small delay between agents to avoid rate limits
                    await new Promise((r) => setTimeout(r, 3000));
                } else {
                    lastRunTimes[sched.id] = now - (sched.intervalMs - dbTimeSince);
                }
            }
        }
    } catch (err) {
        console.error("[AutoScheduler] Cycle error:", err.message);
    }
}

function start() {
    if (isRunning) {
        console.log("[AutoScheduler] Already running");
        return { status: "already_running" };
    }

    isRunning = true;

    // Run first cycle after 10 second delay (let server warm up)
    setTimeout(() => {
        runSchedulerCycle();
    }, 10000);

    // Then run every 60 seconds to check intervals
    intervalId = setInterval(runSchedulerCycle, 60 * 1000);

    console.log("[AutoScheduler] ✅ Started — checking agents every 60s");
    return { status: "started", schedule: SCHEDULE.map((s) => `${s.id}: ${s.label}`) };
}

function stop() {
    isRunning = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    console.log("[AutoScheduler] ⏹ Stopped");
    return { status: "stopped" };
}

function getStatus() {
    return {
        isRunning,
        schedule: SCHEDULE.map((s) => ({
            agent: s.id,
            interval: s.label,
            lastRun: lastRunTimes[s.id] ? new Date(lastRunTimes[s.id]).toISOString() : null,
            nextRunIn: lastRunTimes[s.id]
                ? Math.max(0, Math.round((s.intervalMs - (Date.now() - lastRunTimes[s.id])) / 1000))
                : 0,
        })),
    };
}

module.exports = { start, stop, getStatus };
