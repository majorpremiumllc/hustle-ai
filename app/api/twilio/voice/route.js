/**
 * HustleAI — Twilio Voice AI Agent
 * Answers incoming calls with an AI-powered voice agent.
 * Uses Twilio <Gather> + <Say> with Gemini for dynamic conversation.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/* ── In‑memory call log ───────────────────────── */
if (!global.__hustleai_calls) {
    global.__hustleai_calls = [
        // Demo call
        {
            id: "call_demo_1",
            callerPhone: "+17025550198",
            callerName: "David K.",
            duration: "2:34",
            status: "completed",
            transcript: [
                { role: "ai", text: "Hi, thanks for calling! This is the AI assistant for Artem's Handyman Service. How can I help you today?" },
                { role: "caller", text: "Hi, I need someone to mount a 75 inch TV on a brick wall." },
                { role: "ai", text: "I can definitely help with TV mounting, including on brick walls. We have the right hardware for that. When would you like us to come out?" },
                { role: "caller", text: "Can you come this Saturday?" },
                { role: "ai", text: "Saturday works! I have openings in the morning around 10 AM or afternoon around 2 PM. Which works better? And could I get your address?" },
            ],
            outcome: "Booked — Saturday 10 AM",
            createdAt: new Date(Date.now() - 5400000).toISOString(),
        },
        {
            id: "call_demo_2",
            callerPhone: "+17255550422",
            callerName: "Robert C.",
            duration: "1:45",
            status: "completed",
            transcript: [
                { role: "ai", text: "Hi, thanks for calling! This is the AI assistant for Artem's Handyman Service. How can I help you today?" },
                { role: "caller", text: "I need a ceiling fan installed. I already bought the fan." },
                { role: "ai", text: "Great that you already have the fan! If the existing electrical box is fan-rated, this is usually a straightforward install taking about 1-2 hours. Would you like to schedule a visit?" },
            ],
            outcome: "Estimate requested",
            createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
    ];
}

const VOICE_SYSTEM_PROMPT = `You are an AI phone assistant for Artem's Handyman Service in Las Vegas, NV.

CRITICAL RULES:
- Keep responses VERY SHORT (1-2 sentences max — this is spoken aloud)
- Be warm, friendly, and professional
- You handle: TV mounting, furniture assembly, plumbing, electrical, drywall, painting, doors, windows, ceiling fans, shelving, general repairs
- If asked about pricing: "Artem provides free on-site estimates for all jobs"
- If they want to book: Ask for their preferred day/time and address
- If it's complex or you're unsure: "Let me have Artem call you back to discuss the details"
- Sound natural and conversational, like a real receptionist
- Owner's name is Artem, phone (725) 259-3047`;

/* ── Initial greeting (first call) ────────────── */
export async function POST(request) {
    const formData = await request.formData();
    const from = formData.get("From") || "";
    const speechResult = formData.get("SpeechResult") || "";
    const callSid = formData.get("CallSid") || `call_${Date.now()}`;

    console.log(`[Voice] From: ${from}, Speech: "${speechResult}"`);

    // If no speech yet — this is the initial call
    if (!speechResult) {
        // Log the call
        const callLog = {
            id: callSid,
            callerPhone: from,
            callerName: from,
            duration: "0:00",
            status: "in-progress",
            transcript: [
                { role: "ai", text: "Hi, thanks for calling! This is the AI assistant for Artem's Handyman Service in Las Vegas. How can I help you today?" },
            ],
            outcome: "In progress",
            createdAt: new Date().toISOString(),
        };
        global.__hustleai_calls.unshift(callLog);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/twilio/voice" method="POST">
        <Say voice="Polly.Joanna">Hi, thanks for calling! This is the AI assistant for Artem's Handyman Service in Las Vegas. How can I help you today?</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't hear anything. If you'd like to reach us, please call or text 725-259-3047. Goodbye!</Say>
</Response>`;

        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // Customer said something — generate AI response
    const callLog = global.__hustleai_calls.find((c) => c.id === callSid);
    if (callLog) {
        callLog.transcript.push({ role: "caller", text: speechResult });
    }

    let aiResponse;
    try {
        // Build conversation context
        const history = callLog
            ? callLog.transcript.map((t) => `${t.role === "caller" ? "Caller" : "You"}: ${t.text}`).join("\n")
            : `Caller: ${speechResult}`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: VOICE_SYSTEM_PROMPT,
        });
        const prompt = `Phone conversation:\n${history}\n\nGenerate your next SPOKEN response (1-2 sentences max). Write ONLY the words to speak.`;
        const result = await model.generateContent(prompt);
        aiResponse = result.response.text().trim();
    } catch (err) {
        console.error("[Voice] AI error:", err.message);
        aiResponse = "Let me have Artem call you right back to discuss the details. Can I get your name and the best number to reach you?";
    }

    // Save AI response to transcript
    if (callLog) {
        callLog.transcript.push({ role: "ai", text: aiResponse });
    }

    console.log(`[Voice] AI says: "${aiResponse}"`);

    // Check if conversation should end (booking confirmed, goodbye, etc.)
    const isEnding = /goodbye|bye|thank you|that's all|no more/i.test(speechResult);

    let twiml;
    if (isEnding) {
        if (callLog) {
            callLog.status = "completed";
            callLog.outcome = "Conversation completed";
        }
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${escapeXml(aiResponse)} Thanks for calling Artem's Handyman Service. Have a great day!</Say>
    <Hangup/>
</Response>`;
    } else {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/twilio/voice" method="POST">
        <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't catch that. You can call or text us anytime at 725-259-3047. Goodbye!</Say>
</Response>`;
    }

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

/* ── GET: Fetch call logs ─────────────────────── */
export async function GET() {
    return Response.json({ calls: global.__hustleai_calls });
}

/* ── Helper ───────────────────────────────────── */
function escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
