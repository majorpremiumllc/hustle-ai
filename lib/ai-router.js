/**
 * HustleAI — AI Provider Router + Fallback Engine
 * 
 * Ensures no message is ever dropped:
 *   1. Gemini 2.0 Flash (primary)
 *   2. Template Engine (fallback if Gemini fails)
 *   3. OpenAI GPT-4o-mini (optional, if OPENAI_API_KEY is set)
 * 
 * Architecture:
 *   SMS In → Compliance → Provider Router → Response
 *                              ├─ Gemini (primary)
 *                              ├─ OpenAI (fallback #1, if configured)
 *                              └─ Template (fallback #2, always available)
 * 
 * Logs every attempt, latency, provider used, and failure reason.
 */

const PROVIDERS = {
    GEMINI: "gemini",
    OPENAI: "openai",
    TEMPLATE: "template",
};

// ═══════════════════════════════════════
// PROVIDER: GEMINI (PRIMARY)
// ═══════════════════════════════════════
async function callGemini(prompt, systemInstruction) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction || undefined,
    });

    const start = Date.now();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const latency = Date.now() - start;
    const tokens = result.response.usageMetadata?.totalTokenCount || 0;

    return { text, latency, tokens, provider: PROVIDERS.GEMINI };
}

// ═══════════════════════════════════════
// PROVIDER: OPENAI (FALLBACK #1)
// ═══════════════════════════════════════
async function callOpenAI(prompt, systemInstruction) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: key });

    const start = Date.now();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    const latency = Date.now() - start;
    const tokens = response.usage?.total_tokens || 0;

    return { text, latency, tokens, provider: PROVIDERS.OPENAI };
}

// ═══════════════════════════════════════
// PROVIDER: TEMPLATE ENGINE (FALLBACK #2)
// ═══════════════════════════════════════
const TEMPLATES = {
    greeting: (company) =>
        `Thanks for reaching out to ${company}! We received your message and will get back to you shortly. Reply STOP to opt out.`,
    missedCall: (company) =>
        `Sorry we missed your call! This is ${company}. We're unable to take your call right now but we'd love to help — reply here with what you need!`,
    afterHours: (company) =>
        `Thanks for contacting ${company}! We're currently outside business hours but will respond first thing. For emergencies, please call back.`,
    booking: (company) =>
        `Great! We'd love to help you. To get you scheduled with ${company}, could you share: 1) What service you need 2) Your preferred date/time 3) Your address? We'll get right back with availability!`,
    pricing: (company) =>
        `Thanks for asking about pricing! ${company} provides free estimates with no obligation. Every project is unique — reply with details about what you need and we'll get you a quote!`,
    default: (company) =>
        `Thanks for your message! ${company} received it and we'll respond shortly. If you need immediate assistance, please call us directly.`,
};

function callTemplate(prompt, systemInstruction, companyName = "Our team") {
    const lower = prompt.toLowerCase();

    let templateKey = "default";
    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("estimate")) {
        templateKey = "pricing";
    } else if (lower.includes("book") || lower.includes("schedule") || lower.includes("appointment") || lower.includes("available")) {
        templateKey = "booking";
    } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        templateKey = "greeting";
    }

    const text = TEMPLATES[templateKey](companyName);
    return { text, latency: 0, tokens: 0, provider: PROVIDERS.TEMPLATE, templateKey };
}

// ═══════════════════════════════════════
// PROVIDER ROUTER
// ═══════════════════════════════════════

// In-memory metrics
const metrics = {
    total: 0,
    byProvider: { gemini: 0, openai: 0, template: 0 },
    failures: { gemini: 0, openai: 0 },
    totalLatency: 0,
    lastFailure: null,
};

/**
 * Route an AI request through the provider chain.
 * Never drops a message — always returns a response.
 * 
 * @param {string} prompt - The user's message
 * @param {string} systemInstruction - The system prompt for AI context
 * @param {string} companyName - Company name for template fallback
 * @returns {{ text, provider, latency, tokens, fallback, error? }}
 */
export async function routeAI(prompt, systemInstruction, companyName = "Our team") {
    metrics.total++;

    // ── Try Gemini (Primary) ──
    try {
        const result = await callGemini(prompt, systemInstruction);
        metrics.byProvider.gemini++;
        metrics.totalLatency += result.latency;
        console.log(`[AI Router] ✅ Gemini responded (${result.latency}ms, ${result.tokens} tokens)`);
        return { ...result, fallback: false };
    } catch (geminiErr) {
        metrics.failures.gemini++;
        metrics.lastFailure = { provider: "gemini", error: geminiErr.message, time: new Date().toISOString() };
        console.warn(`[AI Router] ⚠️ Gemini failed: ${geminiErr.message.substring(0, 100)}`);
    }

    // ── Try OpenAI (Fallback #1) ──
    if (process.env.OPENAI_API_KEY) {
        try {
            const result = await callOpenAI(prompt, systemInstruction);
            metrics.byProvider.openai++;
            metrics.totalLatency += result.latency;
            console.log(`[AI Router] ✅ OpenAI fallback responded (${result.latency}ms)`);
            return { ...result, fallback: true, fallbackReason: "gemini_failed" };
        } catch (openaiErr) {
            metrics.failures.openai++;
            metrics.lastFailure = { provider: "openai", error: openaiErr.message, time: new Date().toISOString() };
            console.warn(`[AI Router] ⚠️ OpenAI fallback failed: ${openaiErr.message.substring(0, 100)}`);
        }
    }

    // ── Template Engine (Fallback #2 — Always Works) ──
    const result = callTemplate(prompt, systemInstruction, companyName);
    metrics.byProvider.template++;
    console.log(`[AI Router] 📝 Template fallback: ${result.templateKey} (${companyName})`);
    return { ...result, fallback: true, fallbackReason: "all_ai_failed" };
}

// ═══════════════════════════════════════
// METRICS + MONITORING
// ═══════════════════════════════════════

export function getAIMetrics() {
    const avgLatency = metrics.total > 0
        ? Math.round(metrics.totalLatency / (metrics.byProvider.gemini + metrics.byProvider.openai))
        : 0;

    return {
        total: metrics.total,
        byProvider: { ...metrics.byProvider },
        failures: { ...metrics.failures },
        avgLatencyMs: avgLatency,
        fallbackRate: metrics.total > 0
            ? ((metrics.byProvider.template + metrics.byProvider.openai) / metrics.total * 100).toFixed(1) + "%"
            : "0%",
        lastFailure: metrics.lastFailure,
        providers: {
            gemini: { configured: !!process.env.GEMINI_API_KEY, status: metrics.failures.gemini > 3 ? "degraded" : "ok" },
            openai: { configured: !!process.env.OPENAI_API_KEY, status: process.env.OPENAI_API_KEY ? "standby" : "not-configured" },
            template: { configured: true, status: "always-on" },
        },
    };
}

export function resetAIMetrics() {
    metrics.total = 0;
    metrics.byProvider = { gemini: 0, openai: 0, template: 0 };
    metrics.failures = { gemini: 0, openai: 0 };
    metrics.totalLatency = 0;
    metrics.lastFailure = null;
}
