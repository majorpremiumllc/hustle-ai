/**
 * HustleAI — Lead Nurture Agent
 * Sends follow-up sequences to warm leads that haven't converted.
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { LEAD_NURTURE_PROMPT } = require("./prompts");

// Follow-up windows: Day 1, Day 3, Day 7
const FOLLOWUP_WINDOWS = [
    { minDays: 1, maxDays: 2, label: "Day 1" },
    { minDays: 3, maxDays: 4, label: "Day 3" },
    { minDays: 7, maxDays: 8, label: "Day 7" },
];

async function run(companyId) {
    const now = new Date();
    let followUpsSent = 0;
    const results = [];

    // Find leads that were contacted but not converted
    const leads = await prisma.lead.findMany({
        where: {
            companyId,
            status: { in: ["contacted", "estimate_scheduled"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
    });

    // Find contacts that replied but didn't convert
    const contacts = await prisma.outreachContact.findMany({
        where: { status: "replied" },
        take: 10,
    });

    // Process leads for follow-up
    for (const lead of leads) {
        const daysSinceUpdate = Math.floor((now - new Date(lead.updatedAt)) / (1000 * 60 * 60 * 24));

        // Find the right follow-up window
        const window = FOLLOWUP_WINDOWS.find((w) => daysSinceUpdate >= w.minDays && daysSinceUpdate < w.maxDays);
        if (!window) continue;

        const leadInfo = `Lead: ${lead.customerName || "Unknown"}
Phone: ${lead.customerPhone || "N/A"}
Email: ${lead.customerEmail || "N/A"}
Job type: ${lead.jobType || "General"}
Status: ${lead.status}
Days since last contact: ${daysSinceUpdate}
Follow-up stage: ${window.label}`;

        const followUp = await askGemini(LEAD_NURTURE_PROMPT, leadInfo);

        if (followUp.message) {
            const channel = followUp.channel || (lead.customerPhone ? "sms" : "email");

            if (channel === "sms" && lead.customerPhone) {
                await sendFollowUpSMS(lead.customerPhone, followUp.message);
            }

            // Log to email logs if email type
            if (channel === "email" && lead.customerEmail) {
                await prisma.emailLog.create({
                    data: {
                        companyId,
                        to: lead.customerEmail,
                        subject: followUp.subject || `Follow-up: ${lead.jobType || "Your request"}`,
                        body: followUp.message,
                        agent: "lead-nurture",
                    },
                });
            }

            followUpsSent++;
            results.push({
                name: lead.customerName,
                channel,
                stage: window.label,
                message: followUp.message.slice(0, 100),
            });
        }
    }

    // Process campaign contacts that replied
    for (const contact of contacts) {
        const daysSinceReply = Math.floor((now - new Date(contact.updatedAt)) / (1000 * 60 * 60 * 24));

        const window = FOLLOWUP_WINDOWS.find((w) => daysSinceReply >= w.minDays && daysSinceReply < w.maxDays);
        if (!window) continue;

        const contactInfo = `Contact: ${contact.name}
Phone: ${contact.phone || "N/A"}
Email: ${contact.email || "N/A"}
Status: replied (interested)
Days since reply: ${daysSinceReply}
Follow-up stage: ${window.label}`;

        const followUp = await askGemini(LEAD_NURTURE_PROMPT, contactInfo);

        if (followUp.message) {
            if (contact.phone) {
                await sendFollowUpSMS(contact.phone, followUp.message);
            }

            followUpsSent++;
            results.push({
                name: contact.name,
                stage: window.label,
                message: followUp.message.slice(0, 100),
            });

            // Update contact status to "converted" if Day 7 follow-up
            if (window.label === "Day 7") {
                await prisma.outreachContact.update({
                    where: { id: contact.id },
                    data: { lastMsg: `[Nurture ${window.label}] ${followUp.message.slice(0, 100)}` },
                });
            }
        }
    }

    return { followUpsSent, details: results };
}

async function sendFollowUpSMS(to, body) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || accountSid.includes("PASTE") || !authToken || authToken.includes("PASTE")) {
        console.log(`[Nurture] 📝 Follow-up logged: ${to} — ${body.slice(0, 80)}...`);
        return true;
    }

    try {
        const twilio = require("twilio")(accountSid, authToken);
        await twilio.messages.create({ body, from, to });
        console.log(`[Nurture] ✅ Follow-up sent to ${to}`);
        return true;
    } catch (err) {
        console.error(`[Nurture] ❌ Error: ${err.message}`);
        return false;
    }
}

module.exports = { run };
