/**
 * HustleAI — Email Outreach Agent
 * Generates personalized cold emails via Gemini and sends via Resend (or logs if no API key).
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { EMAIL_OUTREACH_PROMPT } = require("./prompts");

async function run(companyId) {
    // Find active email campaigns with contacts that haven't been emailed
    const campaigns = await prisma.outreachCampaign.findMany({
        where: { companyId, status: "active", channel: { contains: "Email" } },
        include: {
            contacts: {
                where: { status: "sent" }, // not yet opened/replied
                take: 5,
            },
        },
    });

    // Also find uncontacted market opportunities
    const opportunities = await prisma.marketOpportunity.findMany({
        where: { companyId, contacted: false },
        take: 3,
    });

    let emailsSent = 0;
    const results = [];

    // Process campaign contacts
    for (const campaign of campaigns) {
        for (const contact of campaign.contacts) {
            if (!contact.email) continue;

            // Parse business info for personalization
            const businessInfo = `Business: ${contact.name}\nEmail: ${contact.email}\nCampaign: ${campaign.name}`;

            const emailData = await askGemini(EMAIL_OUTREACH_PROMPT, businessInfo);

            if (emailData.subject && emailData.body) {
                // Send email (or log if no Resend key)
                const sent = await sendEmail(companyId, contact.email, emailData.subject, emailData.body);
                if (sent) {
                    emailsSent++;
                    results.push({ to: contact.email, subject: emailData.subject });

                    // Update campaign stats
                    await prisma.outreachCampaign.update({
                        where: { id: campaign.id },
                        data: { sent: { increment: 1 } },
                    });
                }
            }
        }
    }

    // Process market opportunities (generate outreach emails)
    for (const opp of opportunities) {
        let issues = [];
        try { issues = JSON.parse(opp.issues || "[]"); } catch (e) { /* */ }

        const businessInfo = `Business: ${opp.business}\nLocation: ${opp.location}\nIndustry: ${opp.industry}\nIssues found: ${issues.join(", ")}\nPotential: ${opp.potential}`;

        const emailData = await askGemini(EMAIL_OUTREACH_PROMPT, businessInfo);

        if (emailData.subject && emailData.body) {
            // We don't have their email, so just log the generated email
            await prisma.emailLog.create({
                data: {
                    companyId,
                    to: `${opp.business.replace(/\s+/g, "").toLowerCase()}@example.com`,
                    subject: emailData.subject,
                    body: emailData.body,
                    agent: "email-outreach",
                },
            });
            emailsSent++;

            // Mark opportunity as contacted
            await prisma.marketOpportunity.update({
                where: { id: opp.id },
                data: { contacted: true },
            });

            results.push({ to: opp.business, subject: emailData.subject });
        }
    }

    return { emailsSent, details: results };
}

async function sendEmail(companyId, to, subject, body) {
    // Try Resend if API key exists
    if (process.env.RESEND_API_KEY) {
        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "HustleAI <outreach@hustleai.com>",
                    to,
                    subject,
                    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        ${body.split("\n").map((p) => `<p>${p}</p>`).join("")}
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Sent by HustleAI</p>
                    </div>`,
                }),
            });

            if (res.ok) {
                console.log(`[Email] ✅ Sent to ${to}: ${subject}`);
            } else {
                console.log(`[Email] ⚠ Resend error for ${to}:`, await res.text());
            }
        } catch (err) {
            console.error(`[Email] Error sending to ${to}:`, err.message);
        }
    } else {
        console.log(`[Email] 📝 Logged (no RESEND_API_KEY): ${to} — ${subject}`);
    }

    // Always log to DB
    await prisma.emailLog.create({
        data: { companyId, to, subject, body, agent: "email-outreach" },
    });

    return true;
}

module.exports = { run };
