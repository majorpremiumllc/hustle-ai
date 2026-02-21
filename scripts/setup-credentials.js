#!/usr/bin/env node
/**
 * HustleAI — Credential Setup Script
 * Takes new Twilio + Stripe credentials and updates .env.local
 * 
 * Usage:
 *   node scripts/setup-credentials.js \
 *     --twilio-sid ACxxxxxxxxx \
 *     --twilio-token xxxxxxxxx \
 *     --twilio-number +15551234567 \
 *     --stripe-pk pk_live_xxx \
 *     --stripe-sk sk_live_xxx \
 *     --stripe-whsec whsec_xxx
 * 
 * Also validates each credential by making a test API call.
 */

const fs = require("fs");
const path = require("path");

function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i += 2) {
        const key = argv[i].replace(/^--/, "");
        args[key] = argv[i + 1];
    }
    return args;
}

async function validateTwilio(sid, token) {
    try {
        const twilio = require("twilio")(sid, token);
        const account = await twilio.api.accounts(sid).fetch();
        console.log(`   ✅ Twilio account: ${account.friendlyName} (${account.status})`);
        return true;
    } catch (err) {
        console.error(`   ❌ Twilio validation failed: ${err.message}`);
        return false;
    }
}

async function validateTwilioNumber(sid, token, number) {
    try {
        const twilio = require("twilio")(sid, token);
        const numbers = await twilio.incomingPhoneNumbers.list({ phoneNumber: number });
        if (numbers.length > 0) {
            const n = numbers[0];
            console.log(`   ✅ Number ${number} found (SID: ${n.sid})`);
            console.log(`      SMS URL:   ${n.smsUrl || "not set"}`);
            console.log(`      Voice URL: ${n.voiceUrl || "not set"}`);
            return n;
        }
        console.error(`   ❌ Number ${number} not found in this account`);
        return null;
    } catch (err) {
        console.error(`   ❌ Number validation failed: ${err.message}`);
        return null;
    }
}

async function configureTwilioWebhooks(sid, token, numberSid) {
    const BASE = "https://tryhustleai.com";
    try {
        const twilio = require("twilio")(sid, token);
        await twilio.incomingPhoneNumbers(numberSid).update({
            smsUrl: `${BASE}/api/twilio/sms`,
            smsMethod: "POST",
            voiceUrl: `${BASE}/api/twilio/voice`,
            voiceMethod: "POST",
            statusCallback: `${BASE}/api/twilio/status`,
            statusCallbackMethod: "POST",
        });
        console.log(`   ✅ Webhooks configured:`);
        console.log(`      SMS   → ${BASE}/api/twilio/sms`);
        console.log(`      Voice → ${BASE}/api/twilio/voice`);
        console.log(`      Status → ${BASE}/api/twilio/status`);
        return true;
    } catch (err) {
        console.error(`   ❌ Webhook setup failed: ${err.message}`);
        return false;
    }
}

async function validateStripe(sk) {
    try {
        const stripe = require("stripe")(sk);
        const account = await stripe.accounts.retrieve();
        console.log(`   ✅ Stripe account: ${account.business_profile?.name || account.email || account.id}`);
        return true;
    } catch (err) {
        console.error(`   ❌ Stripe validation failed: ${err.message}`);
        return false;
    }
}

async function validateGemini() {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("   ❌ GEMINI_API_KEY not set");
        return false;
    }
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Reply with only the word 'OK'");
        const text = result.response.text().trim();
        const usage = result.response.usageMetadata;
        console.log(`   ✅ Gemini responded: "${text}"`);
        if (usage) {
            console.log(`      Tokens — prompt: ${usage.promptTokenCount}, output: ${usage.candidatesTokenCount}`);
        }
        return true;
    } catch (err) {
        console.error(`   ❌ Gemini test failed: ${err.message}`);
        return false;
    }
}

function updateEnvFile(updates) {
    const envPath = path.join(__dirname, "..", ".env.local");
    let content = fs.readFileSync(envPath, "utf8");

    for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, "m");
        const newLine = `${key}="${value}"`;
        if (regex.test(content)) {
            content = content.replace(regex, newLine);
            console.log(`   Updated: ${key}`);
        } else {
            content += `\n${newLine}`;
            console.log(`   Added:   ${key}`);
        }
    }

    fs.writeFileSync(envPath, content);
    console.log(`   ✅ .env.local updated\n`);
}

async function main() {
    const args = parseArgs();

    console.log("═══════════════════════════════════════════");
    console.log("  TryHustleAI — Credential Setup");
    console.log("═══════════════════════════════════════════\n");

    const envUpdates = {};
    let allValid = true;

    // ─── Twilio ───
    if (args["twilio-sid"] && args["twilio-token"]) {
        console.log("🔐 Validating Twilio credentials...");
        const valid = await validateTwilio(args["twilio-sid"], args["twilio-token"]);
        if (!valid) allValid = false;

        if (valid && args["twilio-number"]) {
            console.log("\n📱 Validating phone number...");
            const numberInfo = await validateTwilioNumber(args["twilio-sid"], args["twilio-token"], args["twilio-number"]);

            if (numberInfo) {
                console.log("\n🔗 Configuring webhooks...");
                await configureTwilioWebhooks(args["twilio-sid"], args["twilio-token"], numberInfo.sid);
            }
        }

        envUpdates.TWILIO_ACCOUNT_SID = args["twilio-sid"];
        envUpdates.TWILIO_AUTH_TOKEN = args["twilio-token"];
        if (args["twilio-number"]) envUpdates.TWILIO_PHONE_NUMBER = args["twilio-number"];
        console.log("");
    }

    // ─── Stripe ───
    if (args["stripe-sk"]) {
        console.log("💳 Validating Stripe credentials...");
        const valid = await validateStripe(args["stripe-sk"]);
        if (!valid) allValid = false;

        envUpdates.STRIPE_SECRET_KEY = args["stripe-sk"];
        if (args["stripe-pk"]) envUpdates.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = args["stripe-pk"];
        if (args["stripe-whsec"]) envUpdates.STRIPE_WEBHOOK_SECRET = args["stripe-whsec"];
        console.log("");
    }

    // ─── Gemini ───
    console.log("🤖 Testing Gemini API...");
    const geminiOk = await validateGemini();
    if (!geminiOk) allValid = false;
    console.log("");

    // ─── Update .env.local ───
    if (Object.keys(envUpdates).length > 0) {
        console.log("📝 Updating .env.local...");
        updateEnvFile(envUpdates);
    }

    // ─── Summary ───
    console.log("═══════════════════════════════════════════");
    if (allValid) {
        console.log("  ✅ All credentials validated");
    } else {
        console.log("  ⚠️  Some validations failed — check output above");
    }
    console.log("═══════════════════════════════════════════\n");

    console.log("Next steps:");
    console.log("  1. Deploy: vercel --prod");
    console.log("  2. Add env vars to Vercel: vercel env add <KEY> production");
    console.log("  3. Run smoke test: node scripts/smoke-test.js");
}

main().catch(err => {
    console.error("Setup failed:", err);
    process.exit(1);
});
