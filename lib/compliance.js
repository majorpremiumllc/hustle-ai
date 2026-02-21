/**
 * HustleAI — SMS Compliance Middleware
 * Enforces STOP/HELP keywords, tracks consent, logs compliance events,
 * and calculates per-client Messaging Compliance Score.
 * 
 * Must run BEFORE any AI response generation.
 */

import prisma from "@/lib/prisma";

// ── STOP/HELP Keywords ──────────────────────────
const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "end", "quit", "opt-out", "optout"];
const HELP_KEYWORDS = ["help", "info", "support"];
const START_KEYWORDS = ["start", "subscribe", "yes", "unstop", "opt-in", "optin"];

/**
 * Process compliance for an incoming SMS.
 * Returns { allowed, response } — if not allowed, use response as TwiML reply.
 * 
 * @param {string} companyId - Company ID
 * @param {string} from - Sender phone number
 * @param {string} body - Message body
 * @param {string} companyPhone - Company's Twilio number
 * @returns {Promise<{ allowed: boolean, response?: string, event?: string }>}
 */
export async function processCompliance(companyId, from, body, companyPhone) {
    const normalized = body.trim().toLowerCase();

    // ── STOP: Opt-out ────────────────────────────
    if (STOP_KEYWORDS.includes(normalized)) {
        await handleOptOut(companyId, from);
        await logComplianceEvent(companyId, "stop-received", from, { keyword: normalized });
        return {
            allowed: false,
            event: "opt-out",
            response: "You have been unsubscribed and will no longer receive text messages. Reply START to re-subscribe.",
        };
    }

    // ── HELP: Info request ───────────────────────
    if (HELP_KEYWORDS.includes(normalized)) {
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        await logComplianceEvent(companyId, "help-received", from);
        return {
            allowed: false,
            event: "help",
            response: `${company?.name || "Our team"} SMS support. Reply STOP to unsubscribe. For help, call ${company?.emergencyNumber || company?.phone || companyPhone}. Msg & data rates may apply.`,
        };
    }

    // ── START: Re-opt-in ─────────────────────────
    if (START_KEYWORDS.includes(normalized)) {
        await handleOptIn(companyId, from, "sms-keyword");
        await logComplianceEvent(companyId, "opt-in", from, { keyword: normalized });
        return {
            allowed: false,
            event: "opt-in",
            response: "You have been re-subscribed to text messages. Reply STOP to unsubscribe. Reply HELP for help.",
        };
    }

    // ── Check if opted out ───────────────────────
    const consent = await prisma.smsConsent.findUnique({
        where: { companyId_phone: { companyId, phone: from } },
    });

    if (consent?.status === "opted-out") {
        // Silently drop — do not respond to opted-out numbers
        return { allowed: false, event: "blocked-opted-out" };
    }

    // ── Auto-record consent on first message ─────
    if (!consent) {
        await handleOptIn(companyId, from, "sms");
    }

    // ── Rate limiting per client ─────────────────
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await prisma.message.count({
        where: {
            conversation: { companyId },
            role: "assistant",
            createdAt: { gte: today },
        },
    });

    const maxPerDay = company?.maxSmsPerDay || 100;
    if (sentToday >= maxPerDay) {
        await logComplianceEvent(companyId, "rate-limit-hit", from, { sentToday, limit: maxPerDay });
        return {
            allowed: false,
            event: "rate-limited",
            response: `We've reached our messaging limit for today. Please call ${company?.phone || "us"} directly for assistance.`,
        };
    }

    return { allowed: true };
}

/**
 * Record opt-in consent.
 */
async function handleOptIn(companyId, phone, source = "sms") {
    await prisma.smsConsent.upsert({
        where: { companyId_phone: { companyId, phone } },
        update: {
            status: "opted-in",
            source,
            optInAt: new Date(),
            optOutAt: null,
            optOutMethod: null,
        },
        create: {
            companyId,
            phone,
            status: "opted-in",
            source,
            consentText: "Customer initiated SMS conversation",
        },
    });
}

/**
 * Record opt-out.
 */
async function handleOptOut(companyId, phone) {
    await prisma.smsConsent.upsert({
        where: { companyId_phone: { companyId, phone } },
        update: {
            status: "opted-out",
            optOutAt: new Date(),
            optOutMethod: "STOP keyword",
        },
        create: {
            companyId,
            phone,
            status: "opted-out",
            source: "sms",
            optOutAt: new Date(),
            optOutMethod: "STOP keyword",
        },
    });
}

/**
 * Log a compliance event.
 */
async function logComplianceEvent(companyId, event, phone = null, details = null) {
    await prisma.complianceLog.create({
        data: {
            companyId,
            event,
            phone,
            details: details ? JSON.stringify(details) : null,
        },
    });
}

/**
 * Calculate Messaging Compliance Score for a client (0-100).
 * Factors: consent coverage, opt-out rate, STOP handling, rate limit adherence.
 */
export async function getComplianceScore(companyId) {
    const [totalConsents, optedOut, complianceLogs, recentMessages] = await Promise.all([
        prisma.smsConsent.count({ where: { companyId } }),
        prisma.smsConsent.count({ where: { companyId, status: "opted-out" } }),
        prisma.complianceLog.findMany({
            where: { companyId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        }),
        prisma.message.count({
            where: { conversation: { companyId }, role: "assistant", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        }),
    ]);

    let score = 100;

    // Penalize high opt-out rate (> 5% = -20 pts)
    const optOutRate = totalConsents > 0 ? (optedOut / totalConsents) * 100 : 0;
    if (optOutRate > 10) score -= 30;
    else if (optOutRate > 5) score -= 20;
    else if (optOutRate > 2) score -= 10;

    // Penalize rate limit hits (-5 per incident)
    const rateLimitHits = complianceLogs.filter(l => l.event === "rate-limit-hit").length;
    score -= Math.min(rateLimitHits * 5, 20);

    // Bonus for STOP/HELP handling (+10 if present)
    const stopHandled = complianceLogs.some(l => l.event === "stop-received");
    const helpHandled = complianceLogs.some(l => l.event === "help-received");
    if (stopHandled) score = Math.min(score + 5, 100);
    if (helpHandled) score = Math.min(score + 5, 100);

    // Penalize if no consent records at all
    if (totalConsents === 0 && recentMessages > 0) score -= 15;

    return {
        score: Math.max(0, Math.min(100, score)),
        details: {
            totalConsents,
            optedOut,
            optOutRate: Math.round(optOutRate * 10) / 10,
            rateLimitHits,
            recentMessages,
            stopHandled,
            helpHandled,
        },
    };
}

/**
 * Check if a client is within business hours.
 * @param {object} company - Company record with businessHours JSON
 * @returns {{ isOpen: boolean, message?: string }}
 */
export function checkBusinessHours(company) {
    if (!company.businessHours) return { isOpen: true };

    try {
        const hours = JSON.parse(company.businessHours);
        const now = new Date();
        const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const today = days[now.getDay()];
        const todayHours = hours[today];

        if (!todayHours || todayHours.closed) {
            return {
                isOpen: false,
                message: company.afterHoursMessage || `Thanks for reaching out! We're currently closed. We'll get back to you during business hours. For emergencies, call ${company.emergencyNumber || company.phone || "us"}.`,
            };
        }

        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (currentTime < todayHours.open || currentTime > todayHours.close) {
            return {
                isOpen: false,
                message: company.afterHoursMessage || `Thanks for reaching out! We're currently closed. We'll get back to you during business hours (${todayHours.open} - ${todayHours.close}). For emergencies, call ${company.emergencyNumber || company.phone || "us"}.`,
            };
        }

        return { isOpen: true };
    } catch {
        return { isOpen: true };
    }
}
