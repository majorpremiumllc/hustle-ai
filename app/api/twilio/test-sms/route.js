/**
 * Test SMS endpoint — sends a test SMS to verify Twilio works.
 * Usage: POST /api/twilio/test-sms { "to": "+17251234567" }
 */
export async function POST(request) {
    const { to } = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
        return Response.json({ error: "Twilio credentials not configured" }, { status: 500 });
    }

    if (!to) {
        return Response.json({ error: "Missing 'to' phone number" }, { status: 400 });
    }

    try {
        const twilio = require("twilio")(accountSid, authToken);
        const message = await twilio.messages.create({
            body: "🚀 Test from HustleAI! Your AI assistant is active and ready to handle calls & messages 24/7. — Hustle AI",
            from,
            to,
        });

        console.log(`[Test SMS] ✅ Sent to ${to}, SID: ${message.sid}`);
        return Response.json({
            success: true,
            messageSid: message.sid,
            to,
            from,
        });
    } catch (err) {
        console.error(`[Test SMS] ❌ Error:`, err.message);
        return Response.json({
            error: err.message,
            code: err.code,
        }, { status: 500 });
    }
}
