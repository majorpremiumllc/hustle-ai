/**
 * HustleAI — Lead Responder Agent
 * Instantly responds to inbound leads from Yelp/Thumbtack with:
 * 1. SMS to customer's phone
 * 2. Reply inside the platform (via email relay)
 * 3. AI follow-up call
 * All triggered simultaneously within seconds of lead arrival.
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { LEAD_RESPONDER_PROMPT, LEAD_CALL_PROMPT } = require("./prompts");

/**
 * Main entry: respond to a single lead across all channels.
 * @param {string} companyId - Company ID
 * @param {object} leadData - Parsed lead info
 * @param {string} leadData.customerName
 * @param {string} leadData.customerPhone
 * @param {string} leadData.customerEmail
 * @param {string} leadData.jobType
 * @param {string} leadData.description
 * @param {string} leadData.source - "Yelp" | "Thumbtack"
 * @param {string} [leadData.replyToEmail] - Platform relay email for in-platform reply
 */
async function respondToLead(companyId, leadData) {
    const results = { sms: null, platformReply: null, call: null };
    const { customerName, customerPhone, jobType, description, source, replyToEmail } = leadData;

    console.log(`[Lead Responder] ⚡ New ${source} lead: ${customerName} — ${jobType}`);

    // ── 1. Generate AI response ───────────────────────
    const leadInfo = `NEW LEAD from ${source}:
Customer: ${customerName || "Unknown"}
Phone: ${customerPhone || "N/A"}
Job type: ${jobType || "General handyman"}
Description: ${description || "No description provided"}
Source platform: ${source}

Generate the response messages.`;

    const aiResponse = await askGemini(LEAD_RESPONDER_PROMPT, leadInfo);

    // Log internal analysis from v7 prompt
    if (aiResponse.internal_analysis) {
        const a = aiResponse.internal_analysis;
        console.log(`[Lead Responder] 🧠 Analysis: ${a.job_category} | Score: ${a.lead_score ?? "?"}/10 | Revenue: ${a.revenue_potential || "?"} | Complexity: ${a.complexity}/5 | Risk: ${a.risk_level}/5 | Pricing: ${a.pricing_format} | Capacity: ${a.capacity_impact || "?"} | Stage: ${a.conversation_stage || "new"}`);
        if (a.upsell_opportunity) console.log(`[Lead Responder] 💡 Upsell: ${a.upsell_opportunity}`);
    }

    const smsMessage = aiResponse.sms_message || aiResponse.message || buildFallbackSMS(customerName, jobType, source);
    const platformReply = aiResponse.platform_reply || aiResponse.raw || smsMessage;
    const callIntro = aiResponse.call_intro || `Hi ${customerName}, this is Major Premium following up on your ${jobType} request!`;

    // ── 2. Send SMS (instant) ─────────────────────────
    if (customerPhone) {
        results.sms = await sendLeadSMS(companyId, customerPhone, smsMessage);
    }

    // ── 3. Reply on platform via email relay (instant) ─
    if (replyToEmail) {
        const { replyOnPlatform } = require("../platform-responder");
        results.platformReply = await replyOnPlatform(replyToEmail, platformReply, source);
    }

    // ── 4. AI follow-up call (with slight delay) ──────
    if (customerPhone) {
        results.call = await initiateLeadCall(companyId, leadData, callIntro);
    }

    // ── 5. Update lead status ─────────────────────────
    try {
        const lead = await prisma.lead.findFirst({
            where: {
                companyId,
                customerPhone: customerPhone || undefined,
                status: "new",
            },
            orderBy: { createdAt: "desc" },
        });

        if (lead) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    status: "contacted",
                    notes: `[AI Auto-Response]\nSMS: ${results.sms ? "✅ Sent" : "❌ No phone"}\nPlatform: ${results.platformReply ? "✅ Replied" : "❌ No relay"}\nCall: ${results.call ? "✅ Initiated" : "❌ Failed"}\n\nAI Message: ${smsMessage}`,
                },
            });
        }
    } catch (e) {
        console.error("[Lead Responder] DB update error:", e.message);
    }

    console.log(`[Lead Responder] ✅ Responded to ${customerName}: SMS=${!!results.sms}, Platform=${!!results.platformReply}, Call=${!!results.call}`);
    return results;
}

/**
 * Send SMS to the lead's phone number.
 */
async function sendLeadSMS(companyId, to, body) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || accountSid.includes("PASTE") || !authToken || authToken.includes("PASTE")) {
        console.log(`[Lead Responder] 📝 SMS logged (no Twilio): ${to} — ${body.slice(0, 80)}...`);
        return { status: "logged", to, body };
    }

    try {
        // Check if company has subaccount
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        let client;

        if (company?.twilioSubAccountSid && company?.twilioSubAuthToken) {
            const twilio = require("twilio");
            client = twilio(company.twilioSubAccountSid, company.twilioSubAuthToken);
        } else {
            const twilio = require("twilio");
            client = twilio(accountSid, authToken);
        }

        const msg = await client.messages.create({ body, from: company?.phone || from, to });
        console.log(`[Lead Responder] 📱 SMS sent to ${to}: ${msg.sid}`);
        return { status: "sent", sid: msg.sid, to };
    } catch (err) {
        console.error(`[Lead Responder] ❌ SMS failed to ${to}:`, err.message);
        return { status: "failed", error: err.message };
    }
}

/**
 * Initiate an AI call to the lead.
 * Adds a 15-second delay so the SMS lands first.
 */
async function initiateLeadCall(companyId, leadData, introScript) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    // Log call to DB
    const callLog = await prisma.callLog.create({
        data: {
            companyId,
            callerPhone: leadData.customerPhone,
            direction: "outbound",
            status: "initiated",
            transcript: `[AI Lead Follow-Up for ${leadData.customerName}]\nJob: ${leadData.jobType}\nSource: ${leadData.source}\n\nIntro: ${introScript}`,
            summary: `Auto follow-up call to ${leadData.source} lead: ${leadData.customerName}`,
            escalated: false,
        },
    });

    if (!accountSid || accountSid.includes("PASTE") || !authToken || authToken.includes("PASTE")) {
        console.log(`[Lead Responder] 📝 Call logged (no Twilio): ${leadData.customerName}`);
        return { status: "logged", callLogId: callLog.id };
    }

    try {
        // Wait 15 seconds so SMS arrives first
        await new Promise((resolve) => setTimeout(resolve, 15000));

        const twilio = require("twilio")(accountSid, authToken);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        const fromNumber = company?.phone || from;

        const safeScript = introScript.replace(/"/g, "'").replace(/&/g, "and").slice(0, 500);

        const call = await twilio.calls.create({
            to: leadData.customerPhone,
            from: fromNumber,
            twiml: `<Response><Say voice="Polly.Matthew">${safeScript}</Say><Pause length="2"/><Gather input="speech" timeout="5" action="${baseUrl}/api/twilio/voice"><Say voice="Polly.Matthew">Would you like to schedule an appointment? I can check available times for you.</Say></Gather></Response>`,
        });

        await prisma.callLog.update({
            where: { id: callLog.id },
            data: { callSid: call.sid, status: "completed" },
        });

        console.log(`[Lead Responder] 📞 Called ${leadData.customerName} at ${leadData.customerPhone} — SID: ${call.sid}`);
        return { status: "called", sid: call.sid, callLogId: callLog.id };
    } catch (err) {
        console.error(`[Lead Responder] ❌ Call failed to ${leadData.customerName}:`, err.message);
        await prisma.callLog.update({
            where: { id: callLog.id },
            data: { status: "failed" },
        });
        return { status: "failed", error: err.message, callLogId: callLog.id };
    }
}

/**
 * Fallback SMS if Gemini fails.
 */
function buildFallbackSMS(name, jobType, source) {
    const greeting = name ? `Hi ${name}!` : "Hi there!";
    const job = jobType ? `your ${jobType} request` : "your request";
    const badge = source === "Thumbtack"
        ? "We're a Platinum Top Pro with 144+ reviews."
        : "We're Yelp Guaranteed with excellent ratings.";
    return `${greeting} This is Artem from Major Premium. Just saw ${job}. ${badge} Our rate is $80/hr (2hr min). Can you send a photo and your address? I'll get you a quick estimate! 💪`;
}

/**
 * Agent runner interface (for engine.js integration).
 * Processes all unresponded new leads.
 */
async function run(companyId) {
    const newLeads = await prisma.lead.findMany({
        where: { companyId, status: "new" },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    let responded = 0;
    const results = [];

    for (const lead of newLeads) {
        const result = await respondToLead(companyId, {
            customerName: lead.customerName,
            customerPhone: lead.customerPhone,
            customerEmail: lead.customerEmail,
            jobType: lead.jobType,
            description: lead.notes,
            source: lead.source || "Manual",
        });

        responded++;
        results.push({
            name: lead.customerName,
            source: lead.source,
            sms: result.sms?.status,
            call: result.call?.status,
        });
    }

    return { leadsResponded: responded, details: results };
}

module.exports = { run, respondToLead };
