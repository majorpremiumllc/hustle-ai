/**
 * HustleAI — Twilio Gateway Router
 * Shared Twilio infrastructure with project isolation, namespace routing,
 * per-client rate limiting, and per-project throttle ceiling.
 * 
 * All TryHustleAI traffic is tagged with project=tryhustleai.
 * MajorPremium traffic never touches this layer.
 * 
 * Architecture:
 *   Inbound SMS → Twilio → Gateway Router → Project Namespace → Client Handler
 *   Outbound SMS → Client → Rate Limiter → Project Throttle → Twilio API
 */

const PROJECT_ID = "tryhustleai";

// ═══════════════════════════════════════
// NAMESPACE ISOLATION
// ═══════════════════════════════════════

/**
 * Namespace map: phone_number → { projectId, clientId, companyId }
 * Built from DB on first request, cached in-process.
 */
const namespaceCache = new Map();
let namespaceCacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

async function resolveNamespace(phoneNumber, prisma) {
    const now = Date.now();

    // Refresh cache if expired
    if (now > namespaceCacheExpiry) {
        const phoneNumbers = await prisma.phoneNumber.findMany({
            where: { active: true },
            include: { company: { select: { id: true, name: true } } },
        });

        namespaceCache.clear();
        for (const pn of phoneNumbers) {
            namespaceCache.set(pn.number, {
                projectId: PROJECT_ID,
                clientId: pn.companyId,
                companyName: pn.company.name,
                phoneLabel: pn.label,
                numberSid: pn.twilioSid,
            });
        }
        namespaceCacheExpiry = now + CACHE_TTL;
    }

    return namespaceCache.get(phoneNumber) || null;
}

/**
 * Route an inbound message to the correct project namespace.
 * Returns null if the number doesn't belong to TryHustleAI.
 */
export async function routeInbound(toNumber, fromNumber, prisma) {
    const namespace = await resolveNamespace(toNumber, prisma);

    if (!namespace) {
        console.log(`[Gateway] ⚠️ Unknown number: ${toNumber} — not in TryHustleAI namespace`);
        return null;
    }

    console.log(`[Gateway] 📥 ${fromNumber} → ${toNumber} | Project: ${namespace.projectId} | Client: ${namespace.companyName} (${namespace.clientId})`);

    return {
        projectId: namespace.projectId,
        clientId: namespace.clientId,
        companyName: namespace.companyName,
        phoneLabel: namespace.phoneLabel,
        allowed: true,
    };
}

// ═══════════════════════════════════════
// PER-CLIENT RATE LIMITER
// ═══════════════════════════════════════

/**
 * Rate limit: max N outbound SMS per client per window.
 * Window: 1 minute (sliding).
 * Default limit: 10 per minute per client.
 */
const clientBuckets = new Map(); // clientId → { timestamps[] }

const CLIENT_RATE_LIMIT = 10;       // Max outbound SMS per client per minute
const CLIENT_RATE_WINDOW = 60_000;  // 1 minute window

export function checkClientRateLimit(clientId) {
    const now = Date.now();
    let bucket = clientBuckets.get(clientId);

    if (!bucket) {
        bucket = { timestamps: [] };
        clientBuckets.set(clientId, bucket);
    }

    // Remove expired timestamps
    bucket.timestamps = bucket.timestamps.filter(t => now - t < CLIENT_RATE_WINDOW);

    if (bucket.timestamps.length >= CLIENT_RATE_LIMIT) {
        console.warn(`[Gateway] 🚫 Rate limited client ${clientId}: ${bucket.timestamps.length}/${CLIENT_RATE_LIMIT} per minute`);
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: CLIENT_RATE_WINDOW - (now - bucket.timestamps[0]),
        };
    }

    bucket.timestamps.push(now);
    return {
        allowed: true,
        remaining: CLIENT_RATE_LIMIT - bucket.timestamps.length,
        used: bucket.timestamps.length,
    };
}

// ═══════════════════════════════════════
// PER-PROJECT THROTTLE CEILING
// ═══════════════════════════════════════

/**
 * Project-level throttle: max N total outbound SMS per minute across all clients.
 * Prevents the entire SaaS from overwhelming Twilio.
 */
const projectBuckets = new Map(); // projectId → { timestamps[] }

const PROJECT_THROTTLE_LIMIT = 60;    // Max 60 outbound SMS per minute for entire project
const PROJECT_THROTTLE_WINDOW = 60_000;

export function checkProjectThrottle(projectId = PROJECT_ID) {
    const now = Date.now();
    let bucket = projectBuckets.get(projectId);

    if (!bucket) {
        bucket = { timestamps: [] };
        projectBuckets.set(projectId, bucket);
    }

    bucket.timestamps = bucket.timestamps.filter(t => now - t < PROJECT_THROTTLE_WINDOW);

    if (bucket.timestamps.length >= PROJECT_THROTTLE_LIMIT) {
        console.warn(`[Gateway] 🚫 Project throttle hit (${projectId}): ${bucket.timestamps.length}/${PROJECT_THROTTLE_LIMIT} per minute`);
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: PROJECT_THROTTLE_WINDOW - (now - bucket.timestamps[0]),
        };
    }

    bucket.timestamps.push(now);
    return {
        allowed: true,
        remaining: PROJECT_THROTTLE_LIMIT - bucket.timestamps.length,
        used: bucket.timestamps.length,
    };
}

// ═══════════════════════════════════════
// OUTBOUND SMS GATE
// ═══════════════════════════════════════

/**
 * Full outbound gate: checks client rate limit + project throttle
 * before allowing an SMS to be sent.
 * 
 * Returns: { allowed, reason?, remaining? }
 */
export function gateSend(clientId) {
    // Check client-level rate limit
    const clientCheck = checkClientRateLimit(clientId);
    if (!clientCheck.allowed) {
        return {
            allowed: false,
            reason: `Client rate limit exceeded (${CLIENT_RATE_LIMIT}/min)`,
            retryAfterMs: clientCheck.retryAfterMs,
        };
    }

    // Check project-level throttle
    const projectCheck = checkProjectThrottle(PROJECT_ID);
    if (!projectCheck.allowed) {
        return {
            allowed: false,
            reason: `Project throttle exceeded (${PROJECT_THROTTLE_LIMIT}/min)`,
            retryAfterMs: projectCheck.retryAfterMs,
        };
    }

    return {
        allowed: true,
        clientRemaining: clientCheck.remaining,
        projectRemaining: projectCheck.remaining,
    };
}

// ═══════════════════════════════════════
// TAGGED TWILIO SEND
// ═══════════════════════════════════════

/**
 * Send SMS through the gateway with full rate limiting and project tagging.
 * Uses client's Twilio subaccount if available, falls back to master.
 */
export async function gatewaySend({ to, body, clientId, from, subAccountSid, subAuthToken }) {
    // Gate check
    const gate = gateSend(clientId);
    if (!gate.allowed) {
        console.warn(`[Gateway] Blocked send to ${to}: ${gate.reason}`);
        return { sent: false, reason: gate.reason, retryAfterMs: gate.retryAfterMs };
    }

    try {
        const twilio = subAccountSid && subAuthToken
            ? require("twilio")(subAccountSid, subAuthToken)
            : require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const msg = await twilio.messages.create({
            to,
            from: from || process.env.TWILIO_PHONE_NUMBER,
            body,
            statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com"}/api/twilio/status`,
        });

        console.log(`[Gateway] ✅ Sent to ${to} | SID: ${msg.sid} | Client: ${clientId} | Project: ${PROJECT_ID}`);

        return {
            sent: true,
            sid: msg.sid,
            project: PROJECT_ID,
            clientId,
            clientRemaining: gate.clientRemaining,
            projectRemaining: gate.projectRemaining,
        };
    } catch (err) {
        console.error(`[Gateway] ❌ Send failed to ${to}: ${err.message}`);
        return { sent: false, reason: err.message };
    }
}

// ═══════════════════════════════════════
// GATEWAY STATUS
// ═══════════════════════════════════════

export function getGatewayStatus() {
    const now = Date.now();

    // Collect client stats
    const clientStats = {};
    for (const [clientId, bucket] of clientBuckets.entries()) {
        const active = bucket.timestamps.filter(t => now - t < CLIENT_RATE_WINDOW);
        clientStats[clientId] = {
            used: active.length,
            limit: CLIENT_RATE_LIMIT,
            remaining: CLIENT_RATE_LIMIT - active.length,
        };
    }

    // Project stats
    const projectBucket = projectBuckets.get(PROJECT_ID);
    const projectActive = projectBucket
        ? projectBucket.timestamps.filter(t => now - t < PROJECT_THROTTLE_WINDOW)
        : [];

    return {
        project: PROJECT_ID,
        projectThrottle: {
            used: projectActive.length,
            limit: PROJECT_THROTTLE_LIMIT,
            remaining: PROJECT_THROTTLE_LIMIT - projectActive.length,
        },
        clientRateLimits: clientStats,
        namespaceCacheSize: namespaceCache.size,
        namespaceCacheExpiresIn: Math.max(0, namespaceCacheExpiry - now),
    };
}

export function invalidateNamespaceCache() {
    namespaceCacheExpiry = 0;
    namespaceCache.clear();
}
