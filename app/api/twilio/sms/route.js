/**
 * HustleAI — Twilio SMS Auto-Responder
 * Receives incoming SMS via Twilio webhook, generates AI reply via Gemini,
 * and sends it back automatically. Uses Prisma for persistence.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { getCompanyByPhone } from "@/lib/plan-limits";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Build the system prompt using the company's AI configuration.
 */
function buildSmsPrompt(company) {
    const name = company.name || "our service";
    const phone = company.phone || "";
    const tone = company.aiTone || "friendly, professional, confident";

    let services = "general home services";
    try {
        const parsed = JSON.parse(company.aiServices || "[]");
        if (parsed.length > 0) services = parsed.join(", ");
    } catch (e) { /* use default */ }

    return `You are an AI SMS auto-responder for ${name}.
Business phone: ${phone}

CRITICAL RULES:
- Keep responses SHORT (2-3 sentences max for SMS)
- Be ${tone}
- Answer questions about services, pricing, and availability
- Services offered: ${services}
- If asked about pricing: "${company.aiPricingMsg || "Pricing depends on scope. We provide free on-site estimates."}"
- If asked about availability: offer next available slots
- If they want to book: confirm time and ask for their address
- Sound human, not robotic. Use casual but professional tone.
- Include business phone number (${phone}) when relevant
- NEVER give exact prices — always say "free estimate" or "depends on the job"`;
}

/* ── Twilio webhook for incoming SMS ──────────── */
export async function POST(request) {
    const formData = await request.formData();
    const from = formData.get("From") || "";
    const body = formData.get("Body") || "";
    const to = formData.get("To") || "";

    console.log(`[SMS] Incoming from ${from}: "${body}"`);

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

    // Generate AI reply using company's config
    let replyText;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: buildSmsPrompt(company),
        });
        const prompt = `Conversation history:\n${history}\n\nGenerate your next SMS reply. Write ONLY the reply text.`;
        const result = await model.generateContent(prompt);
        replyText = result.response.text().trim();
    } catch (err) {
        console.error("[SMS] AI error:", err.message);
        replyText = `Thanks for reaching out! We're currently busy but will get back to you shortly. You can also call us at ${company.phone || "our office"}. — ${company.name}`;
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

    // Auto-create lead from SMS if none exists
    const existingLead = await prisma.lead.findFirst({
        where: { companyId: company.id, customerPhone: from },
    });
    if (!existingLead) {
        await prisma.lead.create({
            data: {
                companyId: company.id,
                customerName: from,
                customerPhone: from,
                source: "SMS",
                jobType: "General",
                notes: body,
                status: "new",
            },
        });
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
