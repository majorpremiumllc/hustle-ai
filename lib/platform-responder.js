/**
 * HustleAI — Platform Responder
 * Replies to customers INSIDE Yelp/Thumbtack by using the email relay address
 * from notification emails. This makes the reply appear as if sent from within
 * the platform, preserving hiring metrics and algorithm ranking.
 */

/**
 * Reply to a customer on their platform via email relay.
 * @param {string} replyToEmail - The relay email address from the notification
 * @param {string} message - The reply message text
 * @param {string} platform - "Yelp" | "Thumbtack"
 * @returns {Promise<{status: string, platform: string}>}
 */
async function replyOnPlatform(replyToEmail, message, platform = "Unknown") {
    if (!replyToEmail) {
        console.log(`[Platform Responder] ⚠ No relay email for ${platform}`);
        return { status: "skipped", platform, reason: "No relay email" };
    }

    // Try Resend first (transactional email service)
    if (process.env.RESEND_API_KEY) {
        try {
            const fromEmail = process.env.PLATFORM_REPLY_FROM || "noreply@tryhustleai.com";

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: `Major Premium <${fromEmail}>`,
                    to: replyToEmail,
                    subject: "", // Platform relays ignore subject
                    text: message, // Plain text works best with relays
                }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[Platform Responder] ✅ Replied on ${platform} via relay: ${data.id}`);
                return { status: "sent", platform, emailId: data.id };
            } else {
                const errText = await res.text();
                console.error(`[Platform Responder] ❌ Resend error for ${platform}:`, errText);
                return { status: "failed", platform, error: errText };
            }
        } catch (err) {
            console.error(`[Platform Responder] ❌ Error replying on ${platform}:`, err.message);
            return { status: "failed", platform, error: err.message };
        }
    }

    // Fallback: try Nodemailer with Gmail SMTP
    if (process.env.GMAIL_APP_PASSWORD) {
        try {
            const nodemailer = require("nodemailer");
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_USER || "majorpremiumllc@gmail.com",
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: `"Major Premium" <${process.env.GMAIL_USER || "majorpremiumllc@gmail.com"}>`,
                to: replyToEmail,
                subject: "", // Platform relays ignore subject
                text: message,
            });

            console.log(`[Platform Responder] ✅ Replied on ${platform} via Gmail SMTP`);
            return { status: "sent", platform, via: "gmail" };
        } catch (err) {
            console.error(`[Platform Responder] ❌ Gmail SMTP error:`, err.message);
            return { status: "failed", platform, error: err.message };
        }
    }

    // No email service configured — log only
    console.log(`[Platform Responder] 📝 Logged reply for ${platform} (no email service configured)`);
    console.log(`  → Reply-to: ${replyToEmail}`);
    console.log(`  → Message: ${message.slice(0, 100)}...`);
    return { status: "logged", platform, replyTo: replyToEmail };
}

module.exports = { replyOnPlatform };
