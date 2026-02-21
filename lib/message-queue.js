/**
 * HustleAI — In-Process Message Queue
 * Lightweight async processing for SMS AI responses.
 * 
 * Architecture:
 * - Webhook receives SMS → enqueues job → returns 200 immediately
 * - Worker processes job → generates AI response → sends via Twilio
 * - Retry logic on AI failure (3 attempts with exponential backoff)
 * - Failed messages saved to DB, never dropped
 * 
 * Note: This is a serverless-compatible in-process queue.
 * For 100+ concurrent clients, upgrade to Redis/Bull queue.
 */

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildClientPrompt } from "@/lib/prompt-engine";
import { recordDeliveryEvent } from "@/lib/telecom-health";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 8000]; // exponential backoff in ms

/**
 * Process an AI SMS response asynchronously.
 * Called after webhook has already validated and saved the inbound message.
 * 
 * @param {object} job - { companyId, conversationId, from, to, body, company }
 * @returns {Promise<{ success: boolean, reply?: string, error?: string }>}
 */
export async function processAIResponse(job) {
    const { companyId, conversationId, from, to, company } = job;

    // Get conversation history
    const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });
    const history = recentMessages.map((m) =>
        `${m.role === "user" ? "Customer" : "You"}: ${m.content}`
    ).join("\n");

    // Attempt AI generation with retry
    let replyText = null;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const systemPrompt = buildClientPrompt(company);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemPrompt,
            });
            const prompt = `Conversation history:\n${history}\n\nGenerate your next SMS reply. Write ONLY the reply text.`;
            const result = await model.generateContent(prompt);
            replyText = result.response.text().trim();

            // Log token usage if available
            const usage = result.response.usageMetadata;
            if (usage) {
                console.log(`[Queue] Token usage — prompt: ${usage.promptTokenCount}, output: ${usage.candidatesTokenCount}`);
            }

            break; // Success — exit retry loop
        } catch (err) {
            lastError = err;
            console.error(`[Queue] AI attempt ${attempt + 1}/${MAX_RETRIES} failed: ${err.message}`);

            if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_DELAYS[attempt]);
            }
        }
    }

    // If all retries failed, use fallback
    if (!replyText) {
        replyText = `Thanks for reaching out! We're currently busy but will get back to you shortly. You can also call us at ${company.phone || "our office"}. — ${company.name}`;
        console.warn(`[Queue] All ${MAX_RETRIES} AI attempts failed, using fallback. Last error: ${lastError?.message}`);
    }

    // Save AI reply to database
    await prisma.message.create({
        data: {
            conversationId,
            role: "assistant",
            content: replyText,
        },
    });

    // Send SMS reply via Twilio
    try {
        const sid = company.twilioSubAccountSid || process.env.TWILIO_ACCOUNT_SID;
        const token = company.twilioSubAuthToken || process.env.TWILIO_AUTH_TOKEN;
        const twilio = require("twilio")(sid, token);

        const statusCallbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com"}/api/twilio/status`;

        const message = await twilio.messages.create({
            from: to,   // Our number
            to: from,   // Customer's number
            body: replyText,
            statusCallback: statusCallbackUrl,
        });

        console.log(`[Queue] ✅ Sent reply ${message.sid}: ${to} → ${from}`);

        return { success: true, reply: replyText, messageSid: message.sid };
    } catch (err) {
        console.error(`[Queue] ❌ Twilio send failed: ${err.message}`);

        // Record the failure in telecom health
        const phoneRecord = await prisma.phoneNumber.findFirst({ where: { number: to } });
        if (phoneRecord) {
            await recordDeliveryEvent(phoneRecord.companyId, "failed", err.code?.toString());
        }

        return { success: false, reply: replyText, error: err.message };
    }
}

/**
 * Enqueue a batch of SMS jobs (for outbound campaigns).
 * Processes them sequentially with rate limiting.
 * 
 * @param {Array} jobs - Array of { to, body, company }
 * @param {number} delayMs - Delay between sends (default 1000ms = 1/sec for 10DLC)
 */
export async function processBatch(jobs, delayMs = 1000) {
    const results = [];
    for (const job of jobs) {
        try {
            const sid = job.company.twilioSubAccountSid || process.env.TWILIO_ACCOUNT_SID;
            const token = job.company.twilioSubAuthToken || process.env.TWILIO_AUTH_TOKEN;
            const twilio = require("twilio")(sid, token);

            const message = await twilio.messages.create({
                from: job.from,
                to: job.to,
                body: job.body,
                statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/status`,
            });

            results.push({ success: true, to: job.to, sid: message.sid });
        } catch (err) {
            results.push({ success: false, to: job.to, error: err.message });
        }

        // Rate limiting delay
        if (delayMs > 0) await sleep(delayMs);
    }
    return results;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
