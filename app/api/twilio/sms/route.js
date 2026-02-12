/**
 * HustleAI — Twilio SMS Auto-Responder
 * Receives incoming SMS via Twilio webhook, generates AI reply via Gemini,
 * and sends it back automatically. Tracks all conversations.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import twilio from "twilio";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/* ── In‑memory conversation store ──────────────── */
if (!global.__hustleai_sms) {
    global.__hustleai_sms = [
        // Demo conversation
        {
            id: "sms_demo_1",
            customerPhone: "+17025550177",
            customerName: "Mike R.",
            messages: [
                { role: "customer", text: "Hey, I've got a leaky kitchen faucet and a door that won't close properly. Can you come take a look?", ts: new Date(Date.now() - 3600000).toISOString() },
                { role: "ai", text: "Hi Mike! Thanks for reaching out. I can definitely help with both the faucet and the door. I have availability tomorrow afternoon — would 2 PM work for you? I'll take a look and give you a free estimate on the spot. You can also call me at (725) 259-3047 if you'd like to discuss details.", ts: new Date(Date.now() - 3500000).toISOString() },
                { role: "customer", text: "2 PM works! What's your address so I can send you the location?", ts: new Date(Date.now() - 3000000).toISOString() },
                { role: "ai", text: "Perfect! Just send me your address and I'll be there at 2 PM tomorrow. I'll bring everything I need for both the faucet and door. See you then! 🔧", ts: new Date(Date.now() - 2900000).toISOString() },
            ],
            status: "active",
            lastActivity: new Date(Date.now() - 2900000).toISOString(),
        },
        {
            id: "sms_demo_2",
            customerPhone: "+17255550301",
            customerName: "Lisa T.",
            messages: [
                { role: "customer", text: "Hi, I need about 10 pictures hung and 3 floating shelves installed. Are you available this week?", ts: new Date(Date.now() - 7200000).toISOString() },
                { role: "ai", text: "Hi Lisa! Absolutely, I'd love to help with that. For 10 pictures and 3 floating shelves, I can usually get that done in one visit (2-3 hours). I have openings on Wednesday and Thursday this week. Which day works better for you?", ts: new Date(Date.now() - 7100000).toISOString() },
            ],
            status: "active",
            lastActivity: new Date(Date.now() - 7100000).toISOString(),
        },
    ];
}

const SMS_SYSTEM_PROMPT = `You are an AI SMS auto-responder for a professional Handyman service in Las Vegas, NV.
Business phone: (725) 259-3047
Owner name: Artem

CRITICAL RULES:
- Keep responses SHORT (2-3 sentences max for SMS)
- Be friendly, professional, and helpful
- Answer questions about services, pricing, and availability
- If asked about pricing: say you provide free estimates on-site
- If asked about availability: offer next available slots (today/tomorrow)
- If they want to book: confirm time and ask for their address
- Always be ready to help with: plumbing, electrical, drywall, TV mounting, furniture assembly, painting, doors, windows, ceiling fans, shelving, general repairs
- Sound human, not robotic. Use casual but professional tone.
- Include your phone number (725) 259-3047 when relevant
- NEVER give exact prices — always say "free estimate" or "depends on the job"`;

/* ── Twilio webhook for incoming SMS ──────────── */
export async function POST(request) {
    const formData = await request.formData();
    const from = formData.get("From") || "";
    const body = formData.get("Body") || "";
    const to = formData.get("To") || "";

    console.log(`[SMS] Incoming from ${from}: "${body}"`);

    // Find or create conversation
    let convo = global.__hustleai_sms.find((c) => c.customerPhone === from);
    if (!convo) {
        convo = {
            id: `sms_${Date.now()}`,
            customerPhone: from,
            customerName: from, // Will be updated if we know the name
            messages: [],
            status: "active",
            lastActivity: new Date().toISOString(),
        };
        global.__hustleai_sms.unshift(convo);
    }

    // Add customer message
    convo.messages.push({ role: "customer", text: body, ts: new Date().toISOString() });
    convo.lastActivity = new Date().toISOString();

    // Build conversation context
    const history = convo.messages.slice(-10).map((m) => `${m.role === "customer" ? "Customer" : "You"}: ${m.text}`).join("\n");

    // Generate AI reply
    let replyText;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SMS_SYSTEM_PROMPT,
        });
        const prompt = `Conversation history:\n${history}\n\nGenerate your next SMS reply. Write ONLY the reply text.`;
        const result = await model.generateContent(prompt);
        replyText = result.response.text().trim();
    } catch (err) {
        console.error("[SMS] AI error:", err.message);
        replyText = `Thanks for reaching out! I'm currently busy on a job but will get back to you shortly. You can also call me at (725) 259-3047. — Artem`;
    }

    // Save AI reply
    convo.messages.push({ role: "ai", text: replyText, ts: new Date().toISOString() });
    convo.lastActivity = new Date().toISOString();

    console.log(`[SMS] Reply to ${from}: "${replyText}"`);

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(replyText)}</Message>
</Response>`;

    return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
    });
}

/* ── GET: Fetch all conversations ──────────────── */
export async function GET() {
    return Response.json({ conversations: global.__hustleai_sms });
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
