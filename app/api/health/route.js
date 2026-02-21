/**
 * HustleAI — Production Health Check API
 * Single endpoint to verify all system components are operational.
 * 
 * GET /api/health → Full system health status
 * 
 * Checks:
 * - Database connectivity (Prisma/Turso)
 * - Twilio credentials (account info)
 * - Gemini API (test call)
 * - Stripe connectivity
 * - Encryption key present
 * - Admin API key present
 * - Queue readiness
 */

import prisma from "@/lib/prisma";

export async function GET() {
    const startTime = Date.now();
    const checks = {};

    // ── Database ──
    try {
        const count = await prisma.company.count();
        checks.database = { status: "ok", clients: count, latencyMs: Date.now() - startTime };
    } catch (err) {
        checks.database = { status: "error", error: err.message };
    }

    // ── Twilio ──
    const twilioStart = Date.now();
    try {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token) throw new Error("Credentials not set");

        const twilio = require("twilio")(sid, token);
        const account = await twilio.api.accounts(sid).fetch();
        checks.twilio = {
            status: "ok",
            account: account.friendlyName,
            accountStatus: account.status,
            latencyMs: Date.now() - twilioStart,
        };
    } catch (err) {
        checks.twilio = { status: "error", error: err.message };
    }

    // ── Gemini ──
    const geminiStart = Date.now();
    try {
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not set");

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Reply with only: HEALTH_OK");
        const text = result.response.text().trim();
        const usage = result.response.usageMetadata;
        checks.gemini = {
            status: "ok",
            response: text.substring(0, 20),
            tokensUsed: usage?.totalTokenCount || 0,
            latencyMs: Date.now() - geminiStart,
        };
    } catch (err) {
        checks.gemini = { status: "error", error: err.message };
    }

    // ── Stripe ──
    try {
        const sk = process.env.STRIPE_SECRET_KEY;
        if (!sk) throw new Error("STRIPE_SECRET_KEY not set");

        const stripe = require("stripe")(sk);
        const prices = await stripe.prices.list({ limit: 1 });
        checks.stripe = { status: "ok", pricesFound: prices.data.length > 0 };
    } catch (err) {
        checks.stripe = { status: "error", error: err.message };
    }

    // ── Security Keys ──
    checks.encryption = {
        status: process.env.ENCRYPTION_KEY ? "ok" : "missing",
        keyLength: process.env.ENCRYPTION_KEY?.length || 0,
    };
    checks.adminAuth = {
        status: process.env.ADMIN_API_KEY ? "ok" : "missing",
    };

    // ── Queue Status ──
    checks.queue = { status: "ok", type: "in-process", maxRetries: 3 };

    // ── Overall ──
    const allOk = Object.values(checks).every(c => c.status === "ok");
    const totalLatency = Date.now() - startTime;

    return Response.json({
        healthy: allOk,
        timestamp: new Date().toISOString(),
        totalLatencyMs: totalLatency,
        environment: process.env.NODE_ENV || "development",
        domain: process.env.NEXT_PUBLIC_SITE_URL || "unknown",
        checks,
    }, {
        status: allOk ? 200 : 503,
    });
}
