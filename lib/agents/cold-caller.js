/**
 * HustleAI — Cold Caller Agent
 * Makes outbound AI sales calls via Twilio + Gemini.
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { COLD_CALL_PROMPT } = require("./prompts");

async function run(companyId) {
    // Find high-potential uncontacted opportunities
    const opportunities = await prisma.marketOpportunity.findMany({
        where: {
            companyId,
            contacted: false,
            potential: { in: ["Critical", "High"] },
        },
        take: 3,
        orderBy: { createdAt: "desc" },
    });

    // Also find contacts from campaigns with "Email + Call" channel
    const callCampaigns = await prisma.outreachCampaign.findMany({
        where: { companyId, status: "active", channel: "Email + Call" },
        include: {
            contacts: {
                where: { phone: { not: null }, status: { in: ["sent", "opened"] } },
                take: 2,
            },
        },
    });

    const callsMade = [];

    // Process opportunities — generate call scripts
    for (const opp of opportunities) {
        let issues = [];
        try { issues = JSON.parse(opp.issues || "[]"); } catch (e) { /* */ }

        const callInfo = `Business to call: ${opp.business}
Location: ${opp.location}
Industry: ${opp.industry}
Known issues: ${issues.join(", ")}
Potential: ${opp.potential}

Generate an opening script for this cold call. Be specific about their issues.`;

        const scriptData = await askGemini(COLD_CALL_PROMPT, callInfo);
        const script = scriptData.raw || JSON.stringify(scriptData);

        // Attempt Twilio call or log
        const result = await makeCall(companyId, opp.business, null, script);
        callsMade.push(result);

        // Mark as contacted
        await prisma.marketOpportunity.update({
            where: { id: opp.id },
            data: { contacted: true },
        });
    }

    // Process campaign contacts
    for (const campaign of callCampaigns) {
        for (const contact of campaign.contacts) {
            const callInfo = `Business to call: ${contact.name}
Phone: ${contact.phone}
Campaign: ${campaign.name}

Generate a personalized opening for this sales call.`;

            const scriptData = await askGemini(COLD_CALL_PROMPT, callInfo);
            const script = scriptData.raw || JSON.stringify(scriptData);

            const result = await makeCall(companyId, contact.name, contact.phone, script);
            callsMade.push(result);

            // Update contact status
            await prisma.outreachContact.update({
                where: { id: contact.id },
                data: { status: "opened", lastMsg: "AI call initiated" },
            });
        }
    }

    return { callsMade: callsMade.length, details: callsMade };
}

async function makeCall(companyId, businessName, phone, script) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    // Log the call to DB regardless
    const callLog = await prisma.callLog.create({
        data: {
            companyId,
            callerPhone: phone || "N/A",
            direction: "outbound",
            status: "initiated",
            transcript: `[AI Script for ${businessName}]\n\n${script.slice(0, 2000)}`,
            summary: `Outbound AI sales call to ${businessName}`,
            escalated: false,
        },
    });

    if (!accountSid || accountSid.includes("PASTE") || !phone) {
        console.log(`[Cold Caller] 📝 Logged script for ${businessName} (no Twilio creds or phone)`);
        return { business: businessName, status: "logged", callLogId: callLog.id };
    }

    try {
        const twilio = require("twilio")(accountSid, authToken);
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

        // Make outbound call with TwiML
        const call = await twilio.calls.create({
            to: phone,
            from,
            twiml: `<Response><Say voice="Polly.Matthew">${script.replace(/"/g, "'").slice(0, 500)}</Say><Pause length="2"/><Gather input="speech" timeout="5" action="${baseUrl}/api/twilio/voice"><Say voice="Polly.Matthew">Would you like to learn more about how we can help your business?</Say></Gather></Response>`,
        });

        await prisma.callLog.update({
            where: { id: callLog.id },
            data: { callSid: call.sid, status: "completed" },
        });

        console.log(`[Cold Caller] 📞 Called ${businessName} at ${phone} — SID: ${call.sid}`);
        return { business: businessName, phone, status: "called", sid: call.sid };
    } catch (err) {
        console.error(`[Cold Caller] ❌ Failed to call ${businessName}:`, err.message);
        await prisma.callLog.update({
            where: { id: callLog.id },
            data: { status: "failed" },
        });
        return { business: businessName, status: "failed", error: err.message };
    }
}

module.exports = { run };
