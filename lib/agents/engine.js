/**
 * HustleAI — Agent Engine
 * Central runner that executes agents, logs runs to DB, handles errors.
 */

// Prisma is ESM default export — handle both import styles
let prisma;
try {
    const m = require("../prisma");
    prisma = m.default || m;
} catch {
    prisma = require("@prisma/client").PrismaClient && new (require("@prisma/client").PrismaClient)();
}
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Gemini Helper ─────────────────────────────────

async function askGemini(prompt, userMessage) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`${prompt}\n\n---\n\n${userMessage}`);
    const text = result.response.text();

    // Try to extract JSON from response (object or array)
    try {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) return JSON.parse(arrayMatch[0]);
    } catch (e) { /* not array */ }

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { /* not JSON */ }

    return { raw: text };
}

// ── Agent Run Logging ─────────────────────────────

async function startRun(companyId, agentName) {
    return prisma.agentRun.create({
        data: { companyId, agent: agentName, status: "running" },
    });
}

async function completeRun(runId, result) {
    return prisma.agentRun.update({
        where: { id: runId },
        data: {
            status: "success",
            result: JSON.stringify(result),
            endedAt: new Date(),
        },
    });
}

async function failRun(runId, error) {
    return prisma.agentRun.update({
        where: { id: runId },
        data: {
            status: "failed",
            result: JSON.stringify({ error: error.message || String(error) }),
            endedAt: new Date(),
        },
    });
}

// ── Execute Agent ─────────────────────────────────

async function executeAgent(companyId, agentName) {
    const run = await startRun(companyId, agentName);

    try {
        let agentModule;
        switch (agentName) {
            case "market-scanner":
                agentModule = require("./market-scanner");
                break;
            case "email-outreach":
                agentModule = require("./email-outreach");
                break;
            case "sms-outreach":
                agentModule = require("./sms-outreach");
                break;
            case "cold-caller":
                agentModule = require("./cold-caller");
                break;
            case "lead-nurture":
                agentModule = require("./lead-nurture");
                break;
            case "lead-responder":
                agentModule = require("./lead-responder");
                break;
            default:
                throw new Error(`Unknown agent: ${agentName}`);
        }

        console.log(`[Agent] ▶ Starting ${agentName} for company ${companyId}`);
        const result = await agentModule.run(companyId);
        console.log(`[Agent] ✅ ${agentName} completed:`, JSON.stringify(result).slice(0, 200));

        await completeRun(run.id, result);
        return { success: true, agent: agentName, result };
    } catch (err) {
        console.error(`[Agent] ❌ ${agentName} failed:`, err.message);
        await failRun(run.id, err);
        return { success: false, agent: agentName, error: err.message };
    }
}

// ── Get Agent Status ──────────────────────────────

const AGENT_DEFINITIONS = [
    { id: "market-scanner", name: "Market Scanner", icon: "🔍", interval: "6h", description: "Scans businesses for automation gaps" },
    { id: "lead-responder", name: "Lead Auto-Responder", icon: "⚡", interval: "realtime", description: "Instant SMS + call + platform reply to Yelp/Thumbtack leads" },
    { id: "email-outreach", name: "Email Outreach", icon: "📧", interval: "30m", description: "Sends personalized cold emails" },
    { id: "sms-outreach", name: "SMS Outreach", icon: "💬", interval: "30m", description: "Sends SMS campaigns via Twilio" },
    { id: "cold-caller", name: "Cold Caller", icon: "📞", interval: "manual", description: "AI-powered outbound sales calls" },
    { id: "lead-nurture", name: "Lead Nurture", icon: "🤝", interval: "24h", description: "Follow-up sequences for warm leads" },
];

async function getAgentStatuses(companyId) {
    const agents = [];

    for (const def of AGENT_DEFINITIONS) {
        // Get last run
        const lastRun = await prisma.agentRun.findFirst({
            where: { companyId, agent: def.id },
            orderBy: { startedAt: "desc" },
        });

        // Get total runs today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const runsToday = await prisma.agentRun.count({
            where: { companyId, agent: def.id, startedAt: { gte: today } },
        });

        // Get success rate (last 10 runs)
        const recentRuns = await prisma.agentRun.findMany({
            where: { companyId, agent: def.id },
            orderBy: { startedAt: "desc" },
            take: 10,
            select: { status: true },
        });
        const successRate = recentRuns.length > 0
            ? Math.round((recentRuns.filter((r) => r.status === "success").length / recentRuns.length) * 100)
            : 0;

        agents.push({
            ...def,
            lastRun: lastRun ? {
                status: lastRun.status,
                startedAt: lastRun.startedAt,
                endedAt: lastRun.endedAt,
                result: lastRun.result ? JSON.parse(lastRun.result) : null,
            } : null,
            runsToday,
            successRate,
        });
    }

    return agents;
}

module.exports = { askGemini, executeAgent, getAgentStatuses, AGENT_DEFINITIONS };
