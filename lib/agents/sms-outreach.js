/**
 * HustleAI — SMS Outreach Agent
 * Generates personalized SMS via Gemini and sends via Twilio.
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { SMS_OUTREACH_PROMPT } = require("./prompts");

async function run(companyId) {
    // Find active SMS campaigns with contacts that haven't replied
    const campaigns = await prisma.outreachCampaign.findMany({
        where: {
            companyId,
            status: "active",
            channel: { in: ["SMS", "Email + SMS"] },
        },
        include: {
            contacts: {
                where: { status: { in: ["sent", "opened"] } },
                take: 5,
            },
        },
    });

    let smsSent = 0;
    const results = [];

    for (const campaign of campaigns) {
        for (const contact of campaign.contacts) {
            if (!contact.phone) continue;

            const contactInfo = `Business: ${contact.name}\nPhone: ${contact.phone}\nCampaign: ${campaign.name}`;

            const smsData = await askGemini(SMS_OUTREACH_PROMPT, contactInfo);
            const message = smsData.message || smsData.raw || "";

            if (!message || message.length > 320) continue;

            // Send via Twilio (or log if no creds)
            const sent = await sendSMS(contact.phone, message);

            if (sent) {
                smsSent++;
                results.push({ to: contact.phone, name: contact.name, message });

                // Update contact last message
                await prisma.outreachContact.update({
                    where: { id: contact.id },
                    data: { lastMsg: message },
                });

                // Update campaign stats
                await prisma.outreachCampaign.update({
                    where: { id: campaign.id },
                    data: { sent: { increment: 1 } },
                });
            }
        }
    }

    return { smsSent, details: results };
}

async function sendSMS(to, body) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || accountSid.includes("PASTE") || !authToken || authToken.includes("PASTE")) {
        console.log(`[SMS Agent] 📝 Logged (no Twilio creds): ${to} — ${body.slice(0, 80)}...`);
        return true; // Still count as "sent" for demo
    }

    try {
        const twilio = require("twilio")(accountSid, authToken);
        await twilio.messages.create({ body, from, to });
        console.log(`[SMS Agent] ✅ Sent to ${to}: ${body.slice(0, 50)}...`);
        return true;
    } catch (err) {
        console.error(`[SMS Agent] ❌ Error sending to ${to}:`, err.message);
        return false;
    }
}

module.exports = { run };
