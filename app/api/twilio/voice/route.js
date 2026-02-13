/**
 * HustleAI — Twilio Voice AI Agent
 * Answers incoming calls with an AI-powered voice agent.
 * Uses Twilio <Gather> + <Say> with Gemini for dynamic conversation.
 * All call logs persisted in Prisma database.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { getCompanyByPhone } from "@/lib/plan-limits";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Build voice system prompt using company's AI configuration.
 */
function buildVoicePrompt(company) {
    const name = company.name || "our service";
    const phone = company.phone || "";
    const tone = company.aiTone || "friendly, professional, confident";

    let services = "general home services";
    try {
        const parsed = JSON.parse(company.aiServices || "[]");
        if (parsed.length > 0) services = parsed.join(", ");
    } catch (e) { /* use default */ }

    return `You are an AI phone assistant for ${name}.

CRITICAL RULES:
- Keep responses VERY SHORT (1-2 sentences max — this is spoken aloud)
- Be ${tone}
- You handle: ${services}
- If asked about pricing: "${company.aiPricingMsg || "We provide free on-site estimates for all jobs"}"
- If they want to book: Ask for their preferred day/time and address
- If it's complex or you're unsure: "${company.aiEscalationMsg || "Let me have our team call you back to discuss the details"}"
- Sound natural and conversational, like a real receptionist
- Business name: ${name}, phone ${phone}`;
}

/* ── POST: Handle voice webhook ──────────────── */
export async function POST(request) {
    const formData = await request.formData();
    const from = formData.get("From") || "";
    const speechResult = formData.get("SpeechResult") || "";
    const callSid = formData.get("CallSid") || `call_${Date.now()}`;
    const calledNumber = formData.get("Called") || formData.get("To") || "";

    console.log(`[Voice] From: ${from}, Speech: "${speechResult}"`);

    // Look up which company owns this number
    let company = await getCompanyByPhone(calledNumber);
    if (!company) {
        company = await prisma.company.findFirst({
            include: { subscription: true },
        });
    }

    if (!company) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Sorry, this number is not currently configured. Please try again later.</Say>
    <Hangup/>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    const greeting = company.aiGreeting ||
        `Hi, thanks for calling! This is the AI assistant for ${company.name}. How can I help you today?`;

    // If no speech yet — this is the initial call
    if (!speechResult) {
        // Create call log in DB
        await prisma.callLog.create({
            data: {
                companyId: company.id,
                callSid,
                callerPhone: from,
                direction: "inbound",
                status: "in-progress",
                transcript: JSON.stringify([
                    { role: "ai", text: greeting },
                ]),
                summary: "In progress",
            },
        });

        // Auto-create lead from call
        const existingLead = await prisma.lead.findFirst({
            where: { companyId: company.id, customerPhone: from },
        });
        if (!existingLead) {
            await prisma.lead.create({
                data: {
                    companyId: company.id,
                    customerName: from,
                    customerPhone: from,
                    source: "Phone",
                    jobType: "General",
                    status: "new",
                },
            });
        }

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/twilio/voice" method="POST">
        <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't hear anything. If you'd like to reach us, please call or text ${company.phone || "our office"}. Goodbye!</Say>
</Response>`;

        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // Customer said something — find existing call log
    const callLog = await prisma.callLog.findFirst({
        where: { callSid, companyId: company.id },
    });

    let transcript = [];
    if (callLog?.transcript) {
        try { transcript = JSON.parse(callLog.transcript); } catch (e) { /* */ }
    }
    transcript.push({ role: "caller", text: speechResult });

    // Generate AI response
    let aiResponse;
    try {
        const history = transcript
            .map((t) => `${t.role === "caller" ? "Caller" : "You"}: ${t.text}`)
            .join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: buildVoicePrompt(company),
        });
        const prompt = `Phone conversation:\n${history}\n\nGenerate your next SPOKEN response (1-2 sentences max). Write ONLY the words to speak.`;
        const result = await model.generateContent(prompt);
        aiResponse = result.response.text().trim();
    } catch (err) {
        console.error("[Voice] AI error:", err.message);
        aiResponse = `Let me have our team call you right back to discuss the details. Can I get your name and the best number to reach you?`;
    }

    // Save AI response to transcript
    transcript.push({ role: "ai", text: aiResponse });

    // Update call log in DB
    if (callLog) {
        await prisma.callLog.update({
            where: { id: callLog.id },
            data: { transcript: JSON.stringify(transcript) },
        });
    }

    console.log(`[Voice] AI says: "${aiResponse}"`);

    // Check if conversation should end
    const isEnding = /goodbye|bye|thank you|that's all|no more/i.test(speechResult);

    let twiml;
    if (isEnding) {
        if (callLog) {
            await prisma.callLog.update({
                where: { id: callLog.id },
                data: {
                    status: "completed",
                    summary: "Conversation completed",
                    transcript: JSON.stringify(transcript),
                },
            });
        }
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${escapeXml(aiResponse)} Thanks for calling ${company.name}. Have a great day!</Say>
    <Hangup/>
</Response>`;
    } else {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/twilio/voice" method="POST">
        <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't catch that. You can call or text us anytime at ${company.phone || "our office"}. Goodbye!</Say>
</Response>`;
    }

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

/* ── GET: Fetch call logs for company ─────────── */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || request.headers.get("x-company-id");

    let whereClause = {};
    if (companyId) {
        whereClause.companyId = companyId;
    } else {
        // Single-tenant fallback
        const company = await prisma.company.findFirst();
        if (!company) return Response.json({ calls: [] });
        whereClause.companyId = company.id;
    }

    const callLogs = await prisma.callLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // Transform to match frontend expected format
    const calls = callLogs.map((c) => {
        let transcript = [];
        try { transcript = JSON.parse(c.transcript || "[]"); } catch (e) { /* */ }

        return {
            id: c.id,
            callerPhone: c.callerPhone,
            callerName: c.callerPhone,
            duration: c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}` : "0:00",
            status: c.status || "unknown",
            transcript,
            outcome: c.summary || "—",
            createdAt: c.createdAt.toISOString(),
        };
    });

    return Response.json({ calls });
}

/* ── Helper ───────────────────────────────────── */
function escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
