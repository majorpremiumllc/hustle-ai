/**
 * HustleAI — Twilio Webhook Signature Validation Middleware
 * Validates X-Twilio-Signature on ALL incoming webhooks.
 * Rejects any request without valid signature.
 * Logs failed validation attempts to ComplianceLog.
 * 
 * MUST be called BEFORE any AI or DB processing.
 */

import { validateRequest } from "twilio";
import prisma from "@/lib/prisma";

/**
 * Validate an incoming Twilio webhook request.
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<{ valid: boolean, params: object|null, error?: string }>}
 */
export async function validateTwilioWebhook(request) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!authToken) {
        console.error("[TwilioAuth] TWILIO_AUTH_TOKEN not configured");
        return { valid: false, params: null, error: "Server misconfiguration" };
    }

    // Get the signature header
    const signature = request.headers.get("x-twilio-signature");

    if (!signature) {
        console.warn("[TwilioAuth] ❌ Missing X-Twilio-Signature header");
        await logFailedValidation(null, "missing-signature", request);
        return { valid: false, params: null, error: "Missing signature" };
    }

    // Clone the request so we can read formData without consuming it
    const cloned = request.clone();

    let formData;
    try {
        formData = await cloned.formData();
    } catch (err) {
        console.warn("[TwilioAuth] ❌ Could not parse form data:", err.message);
        await logFailedValidation(null, "invalid-body", request);
        return { valid: false, params: null, error: "Invalid request body" };
    }

    // Convert FormData to plain object for validation
    const params = {};
    for (const [key, value] of formData.entries()) {
        params[key] = value;
    }

    // Build the full URL that Twilio used to sign
    // In production, use the public URL; Twilio signs against the URL it was configured to call
    const url = buildWebhookUrl(request);

    // Validate the signature
    // Twilio's validateRequest checks: HMAC-SHA1(authToken, url + sorted params)
    const isValid = validateRequest(authToken, signature, url, params);

    if (!isValid) {
        console.warn(`[TwilioAuth] ❌ Invalid signature from ${params.From || "unknown"}`);
        await logFailedValidation(params.From || null, "invalid-signature", request);
        return { valid: false, params, error: "Invalid signature" };
    }

    console.log(`[TwilioAuth] ✅ Valid signature from ${params.From || "unknown"}`);
    return { valid: true, params };
}

/**
 * Build the full webhook URL Twilio signed against.
 * Twilio signs the URL it was configured to POST to.
 */
function buildWebhookUrl(request) {
    // Use the configured public URL, not the internal Vercel URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://tryhustleai.com";
    const urlObj = new URL(request.url);
    return `${baseUrl}${urlObj.pathname}`;
}

/**
 * Log failed validation attempts for security audit.
 */
async function logFailedValidation(phone, reason, request) {
    try {
        // Find a default company for logging (best effort)
        const company = await prisma.company.findFirst();
        if (company) {
            await prisma.complianceLog.create({
                data: {
                    companyId: company.id,
                    event: "webhook-validation-failed",
                    phone,
                    details: JSON.stringify({
                        reason,
                        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
                        userAgent: request.headers.get("user-agent") || "unknown",
                        url: request.url,
                        timestamp: new Date().toISOString(),
                    }),
                },
            });
        }
    } catch (err) {
        // Don't let logging failure break the validation flow
        console.error("[TwilioAuth] Failed to log validation attempt:", err.message);
    }
}

/**
 * Helper: Return a TwiML error response.
 */
export function twilioErrorResponse(message = "Unauthorized") {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
    return new Response(twiml, {
        status: 403,
        headers: { "Content-Type": "text/xml" },
    });
}
