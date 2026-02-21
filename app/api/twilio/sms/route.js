/**
 * HustleAI — Twilio SMS Auto-Responder (Hardened)
 * 
 * Security Pipeline:
 * 1. Twilio Signature Validation (reject fakes)
 * 2. Company Lookup (multi-tenant routing)
 * 3. Subscription Check (expired = no AI)
 * 4. Compliance (STOP/HELP/rate-limit)
 * 5. Business Hours Check
 * 6. Prompt Isolation + AI Generation
 */

import prisma from "@/lib/prisma";
import { routeAI } from "@/lib/ai-router";
import { getCompanyByPhone } from "@/lib/plan-limits";
import { processCompliance, checkBusinessHours } from "@/lib/compliance";
import { buildClientPrompt } from "@/lib/prompt-engine";
import { validateTwilioWebhook, twilioErrorResponse } from "@/lib/twilio-auth";
import { routeInbound } from "@/lib/twilio-gateway";




/* ── Twilio webhook for incoming SMS ──────────── */
export async function POST(request) {
    // ── PHASE 1: Signature Validation (MUST be first) ──
    const validation = await validateTwilioWebhook(request);
    if (!validation.valid) {
        return twilioErrorResponse();
    }

    const { params: formParams } = validation;
    const from = formParams.From || "";
    const body = formParams.Body || "";
    const to = formParams.To || "";

    console.log(`[SMS] Incoming from ${from}: "${body}"`);

    // ── GATEWAY: Namespace routing (project=tryhustleai) ──
    const route = await routeInbound(to, from, prisma);
    // Gateway logs project + client for all inbound traffic

    // Look up which company owns this number
    let company = await getCompanyByPhone(to);

    // Fallback: try to find any company (single-tenant mode)
    if (!company) {
        company = await prisma.company.findFirst({
            include: { subscription: true },
        });
    }

    if (!company) {
        console.error("[SMS] No company found for number:", to);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, this number is not configured. Please try again later.</Message></Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // ── PHASE 6: Subscription Enforcement ──
    const subscription = company.subscription || await prisma.subscription.findUnique({ where: { companyId: company.id } });
    if (!subscription || subscription.status === "canceled" || subscription.status === "past_due") {
        const fallback = `Thanks for reaching out to ${company.name}! We're currently updating our system. Please call us at ${company.phone || "our office"} for immediate assistance.`;
        await saveMessage(company.id, from, body, fallback);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(fallback)}</Message></Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // ── PHASE 1: Compliance Check (runs BEFORE any AI) ──
    const compliance = await processCompliance(company.id, from, body, to);
    if (!compliance.allowed) {
        if (compliance.response) {
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(compliance.response)}</Message>
</Response>`;
            return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
        }
        // Silently drop (opted-out user)
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response/>`, { headers: { "Content-Type": "text/xml" } });
    }

    // ── PHASE 2: Business Hours Check ──
    const hoursCheck = checkBusinessHours(company);
    if (!hoursCheck.isOpen && hoursCheck.message) {
        // Save the message but respond with after-hours message
        let convo = await prisma.conversation.findFirst({
            where: { companyId: company.id, phone: from, channel: "sms", status: "active" },
        });
        if (!convo) {
            convo = await prisma.conversation.create({
                data: { companyId: company.id, phone: from, channel: "sms", status: "active" },
            });
        }
        await prisma.message.create({ data: { conversationId: convo.id, role: "user", content: body } });
        await prisma.message.create({ data: { conversationId: convo.id, role: "assistant", content: hoursCheck.message } });

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(hoursCheck.message)}</Message>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // Find or create conversation
    let convo = await prisma.conversation.findFirst({
        where: { companyId: company.id, phone: from, channel: "sms", status: "active" },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    if (!convo) {
        convo = await prisma.conversation.create({
            data: {
                companyId: company.id,
                phone: from,
                channel: "sms",
                status: "active",
            },
            include: { messages: true },
        });
    }

    // Save customer message
    await prisma.message.create({
        data: {
            conversationId: convo.id,
            role: "user",
            content: body,
        },
    });

    // Build conversation context from DB messages
    const recentMessages = await prisma.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: "asc" },
        take: 10,
    });
    const history = recentMessages.map((m) =>
        `${m.role === "user" ? "Customer" : "You"}: ${m.content}`
    ).join("\n");

    // ── PHASE 3: Generate AI reply via Provider Router ──
    // Fallback chain: Gemini → OpenAI → Template (zero message drops)
    const systemPrompt = buildClientPrompt(company);
    const prompt = `Conversation history:\n${history}\n\nGenerate your next SMS reply. Write ONLY the reply text.`;
    const aiResult = await routeAI(prompt, systemPrompt, company.name);
    const replyText = aiResult.text;

    if (aiResult.fallback) {
        console.warn(`[SMS] Using fallback (${aiResult.provider}): ${aiResult.fallbackReason}`);
    }

    // Save AI reply
    await prisma.message.create({
        data: {
            conversationId: convo.id,
            role: "assistant",
            content: replyText,
        },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
        where: { id: convo.id },
        data: { updatedAt: new Date() },
    });

    console.log(`[SMS] Reply to ${from}: "${replyText}"`);

    // Detect booking confirmation and update lead status
    const isBooking = /booking confirmed/i.test(replyText);

    // Auto-create or update lead from SMS
    const existingLead = await prisma.lead.findFirst({
        where: { companyId: company.id, customerPhone: from },
    });
    if (existingLead) {
        if (isBooking) {
            await prisma.lead.update({
                where: { id: existingLead.id },
                data: {
                    status: "estimate_scheduled",
                    notes: `Booked via SMS. AI confirmation: ${replyText}`,
                },
            });
            console.log(`[SMS] 📅 Booking detected — lead ${existingLead.id} updated to estimate_scheduled`);
        }
    } else {
        await prisma.lead.create({
            data: {
                companyId: company.id,
                customerName: from,
                customerPhone: from,
                source: "SMS",
                jobType: "General",
                notes: isBooking ? `Booked via SMS. AI confirmation: ${replyText}` : body,
                status: isBooking ? "estimate_scheduled" : "new",
            },
        });
        if (isBooking) console.log(`[SMS] 📅 New lead created with booking status`);
    }

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(replyText)}</Message>
</Response>`;

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

/* ── GET: Fetch all conversations for company ──── */
export async function GET(request) {
    // Try to get companyId from query params or header
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || request.headers.get("x-company-id");

    if (!companyId) {
        // Single-tenant fallback
        const company = await prisma.company.findFirst();
        if (!company) return Response.json({ conversations: [] });

        const conversations = await prisma.conversation.findMany({
            where: { companyId: company.id, channel: "sms" },
            include: { messages: { orderBy: { createdAt: "asc" } } },
            orderBy: { updatedAt: "desc" },
            take: 50,
        });

        // Transform to match frontend expected format
        const formatted = conversations.map((c) => ({
            id: c.id,
            customerPhone: c.phone,
            customerName: c.phone,
            messages: c.messages.map((m) => ({
                role: m.role === "user" ? "customer" : "ai",
                text: m.content,
                ts: m.createdAt.toISOString(),
            })),
            status: c.status,
            lastActivity: c.updatedAt.toISOString(),
        }));

        return Response.json({ conversations: formatted });
    }

    const conversations = await prisma.conversation.findMany({
        where: { companyId, channel: "sms" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
        take: 50,
    });

    const formatted = conversations.map((c) => ({
        id: c.id,
        customerPhone: c.phone,
        customerName: c.phone,
        messages: c.messages.map((m) => ({
            role: m.role === "user" ? "customer" : "ai",
            text: m.content,
            ts: m.createdAt.toISOString(),
        })),
        status: c.status,
        lastActivity: c.updatedAt.toISOString(),
    }));

    return Response.json({ conversations: formatted });
}

/* ── Helper: Escape XML for TwiML ──────────────── */
function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/* ── Helper: Save message pair for subscription fallback ── */
async function saveMessage(companyId, from, inbound, outbound) {
    try {
        let convo = await prisma.conversation.findFirst({
            where: { companyId, phone: from, channel: "sms", status: "active" },
        });
        if (!convo) {
            convo = await prisma.conversation.create({
                data: { companyId, phone: from, channel: "sms", status: "active" },
            });
        }
        await prisma.message.create({ data: { conversationId: convo.id, role: "user", content: inbound } });
        await prisma.message.create({ data: { conversationId: convo.id, role: "assistant", content: outbound } });
    } catch (err) {
        console.error("[SMS] Failed to save fallback message:", err.message);
    }
}

