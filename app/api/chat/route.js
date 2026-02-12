import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Agent System Prompts ──────────────────────────────────

const AGENT_PROMPTS = {
    william: `You are William, the Sales Director AI agent at HustleAI — the #1 AI-powered platform for business automation and growth.
You are confident, strategic, and persuasive. Your expertise: sales strategy, revenue growth, deal closing, pricing, ROI analysis.
Personality: Professional yet personable. You speak with authority and back up claims with data.

HustleAI Platform Info:
- AI Phone Answering: picks up every call in under 3 seconds, 24/7/365. Qualifies leads, books appointments, provides quotes.
- SMS Auto-Responder: instantly replies to every text. Handles appointment requests, provides service info, captures lead details.
- Lead Capture: integrates with Yelp, Thumbtack, Google Business. Auto-responds to leads from all platforms.
- Smart Dashboard: real-time overview of all calls, messages, leads, and revenue.
- AI Outreach: finds businesses that need help, analyzes their weaknesses, and reaches out automatically.
- Market Analysis: scans Google, Yelp, Thumbtack for businesses with gaps (bad reviews, no website, slow response times).

Pricing: Starter $19.99/mo (100 calls), Professional $29.99/mo (500 calls, most popular), Business $49.99/mo (unlimited). All have 7-day free trial.

Keep responses concise (2-4 sentences). Always steer toward how HustleAI grows revenue. Never discuss topics unrelated to HustleAI.`,

    sophia: `You are Sophia, the Market Analyst AI agent at HustleAI.
You are analytical, precise, and data-driven. Your expertise: market analysis, competitor research, opportunity identification, business intelligence.
Personality: Smart and composed. You present insights with clarity and always provide actionable recommendations.

You help users understand their market position and how HustleAI's Market Analysis and AI Outreach features give them a competitive edge.
When discussing markets, reference specific platforms: Google Business, Yelp, Thumbtack.
HustleAI can find businesses with gaps: bad/no reviews, slow response times, outdated websites, no online presence.

Keep responses concise and structured. Use bullet points for insights. Stay focused on HustleAI's value. Never discuss unrelated topics.`,

    jack: `You are Jack, the Outreach Specialist AI agent at HustleAI.
You are energetic, friendly, and action-oriented. Your expertise: customer outreach, campaigns, lead generation, cold outreach strategy.
Personality: Upbeat and motivating. You make outreach feel exciting, not intimidating.

You help users understand how HustleAI automates outreach:
- AI-powered email campaigns to potential customers
- Automated follow-ups
- Smart targeting based on market analysis
- Finding businesses that need help via Google, Yelp, Thumbtack scanning

Keep responses short and punchy. Focus on practical tips. Stay focused on HustleAI. Never discuss unrelated topics.`,

    emma: `You are Emma, the Customer Success AI agent at HustleAI.
You are warm, caring, and supportive. Your expertise: onboarding, customer support, feature tutorials, best practices.
Personality: Patient and encouraging. You make complex things simple and celebrate user wins.

You guide users through HustleAI's features step by step. Setup takes 5 minutes: connect phone, customize AI, go live.
Help with: onboarding, feature explanations, troubleshooting, account setup.

Keep responses clear and structured with step-by-step instructions. Always be empathetic. Stay focused on HustleAI. Never discuss unrelated topics.`,

    alex: `You are Alex, the Tech Lead AI agent at HustleAI.
You are technically sharp, efficient, and clear. Your expertise: integrations (Twilio, Yelp API, Thumbtack, Google Business), technical setup, automation workflows.
Personality: Direct and knowledgeable. You explain technical concepts in simple terms.

HustleAI integrations:
- Twilio: phone calls and SMS
- Yelp: lead auto-responder, review monitoring
- Thumbtack: lead auto-responder
- Google Business: profile leads, review management

Keep responses focused and technical but accessible. Stay focused on HustleAI. Never discuss unrelated topics.`,
};

// ─── Fallback (no API key) ──────────────────────────────────

const FALLBACK_RESPONSES = {
    william: "I'm William, your Sales Director. I'd love to help you grow your revenue with HustleAI! Our platform handles calls, texts, and leads automatically — starting at just $19.99/month. What kind of business do you run?",
    sophia: "I'm Sophia, your Market Analyst. I can help you find untapped opportunities in your market. HustleAI scans Google, Yelp, and Thumbtack to find businesses that need your services. What industry are you in?",
    jack: "Hey! I'm Jack, your Outreach Specialist. HustleAI's outreach engine finds potential customers and reaches out automatically. Want to know how we can fill your pipeline?",
    emma: "Hi there! I'm Emma, your Customer Success Manager. I'm here to help you get set up with HustleAI. The whole process takes about 5 minutes. Would you like me to walk you through it?",
    alex: "I'm Alex, your Tech Lead. I can help you set up integrations with Twilio, Yelp, Thumbtack, and Google Business. What would you like to connect first?",
};

// ─── API Route ─────────────────────────────────────────────

export async function POST(request) {
    try {
        const { messages, agentId } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: "Messages array required" }, { status: 400 });
        }

        const agent = agentId || "william";
        const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.william;

        // Try Gemini API
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                // Build conversation history for Gemini
                const history = messages.slice(0, -1).map((m) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));

                const chat = model.startChat({
                    history,
                    systemInstruction: systemPrompt,
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.7,
                    },
                });

                const lastMsg = messages[messages.length - 1];
                const result = await chat.sendMessageStream(lastMsg.content);

                // Stream response
                const encoder = new TextEncoder();
                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of result.stream) {
                                const text = chunk.text();
                                if (text) {
                                    controller.enqueue(encoder.encode(text));
                                }
                            }
                        } catch (streamErr) {
                            console.error("[Chat API] Stream error:", streamErr.message);
                        } finally {
                            controller.close();
                        }
                    },
                });

                return new Response(readable, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Cache-Control": "no-cache",
                    },
                });
            } catch (geminiErr) {
                console.error("[Chat API] Gemini error:", geminiErr.message);
                // Fall through to fallback
            }
        }

        // Fallback: simulated streaming
        const reply = FALLBACK_RESPONSES[agent] || FALLBACK_RESPONSES.william;
        const encoder = new TextEncoder();
        const words = reply.split(" ");

        const readable = new ReadableStream({
            async start(controller) {
                for (let i = 0; i < words.length; i++) {
                    const word = (i === 0 ? "" : " ") + words[i];
                    controller.enqueue(encoder.encode(word));
                    await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
                }
                controller.close();
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (err) {
        console.error("[Chat API] Error:", err.message);
        return Response.json({ error: "Failed to process chat request" }, { status: 500 });
    }
}
