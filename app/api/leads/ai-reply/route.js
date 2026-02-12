/**
 * HustleAI — AI Reply Generator for Leads
 * Uses Gemini to generate personalized responses for handyman service leads.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const HANDYMAN_SYSTEM_PROMPT = `You are an AI assistant for a professional Handyman service business in Las Vegas, NV.
Business phone: (725) 259-3047

Your job: Generate a friendly, professional reply to a customer lead/inquiry.

Services offered: All types of handyman work including:
- TV mounting, furniture assembly, picture hanging, shelving
- Drywall repair, painting, patching
- Plumbing (faucets, toilets, minor repairs)
- Electrical (outlets, switches, ceiling fans, light fixtures)
- Door/window repair, weatherstripping
- Deck/fence repair, pressure washing
- General home repairs and maintenance

Reply guidelines:
- Be warm, professional, and confident
- Acknowledge their specific need
- Mention relevant experience briefly
- Suggest next steps (availability, photos for estimate, etc.)
- Keep it 3-5 sentences max
- Don't include pricing specifics — say you'll provide a quote after seeing the job
- Sound like a real person, not a robot
- If urgent (ASAP), emphasize quick availability
- Include your phone number (725) 259-3047 when appropriate`;

export async function POST(request) {
    try {
        const { customerName, jobType, description, urgency, source } = await request.json();

        const userMessage = `Generate a reply to this customer lead:
Customer: ${customerName}
Job Type: ${jobType}
Source: ${source}
Urgency: ${urgency}
Their Message: "${description}"

Write ONLY the reply message text, nothing else. No subject line, no quotes around it.`;

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: HANDYMAN_SYSTEM_PROMPT,
            });

            const result = await model.generateContent(userMessage);
            const reply = result.response.text().trim();

            return Response.json({ reply });
        } catch (aiErr) {
            console.error("[AI Reply] Gemini error:", aiErr.message);
            // Fallback response
            const fallback = `Hi ${customerName}! Thanks for reaching out about your ${jobType.toLowerCase()} project. I'd love to help! I have availability this week and can provide a free estimate. Could you send a few photos so I can give you an accurate quote? You can also text me directly at (725) 259-3047. Looking forward to hearing from you!`;
            return Response.json({ reply: fallback });
        }
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
