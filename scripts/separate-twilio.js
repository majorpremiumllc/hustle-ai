#!/usr/bin/env node
/**
 * HustleAI — Infrastructure Separation Script
 * 
 * Creates a dedicated Twilio subaccount for MajorPremium LLC,
 * purchases a separate phone number, and outputs the new credentials.
 * 
 * After running, MajorPremium uses the subaccount.
 * TryHustleAI keeps the master account for managing SaaS client subaccounts.
 * 
 * Usage: node scripts/separate-twilio.js
 */

const MASTER_SID = process.env.TWILIO_ACCOUNT_SID;
const MASTER_TOKEN = process.env.TWILIO_AUTH_TOKEN;

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  Twilio Infrastructure Separation");
    console.log("═══════════════════════════════════════════\n");

    if (!MASTER_SID || !MASTER_TOKEN) {
        console.error("❌ TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
        process.exit(1);
    }

    const twilio = require("twilio")(MASTER_SID, MASTER_TOKEN);

    // ─── Step 1: Create subaccount for MajorPremium ───
    console.log("1️⃣  Creating Twilio subaccount for MajorPremium LLC...");
    let subaccount;
    try {
        subaccount = await twilio.api.accounts.create({
            friendlyName: "MajorPremium LLC — Handyman Business",
        });
        console.log(`   ✅ Subaccount SID:  ${subaccount.sid}`);
        console.log(`   ✅ Auth Token:      ${subaccount.authToken}`);
        console.log(`   ✅ Friendly Name:   ${subaccount.friendlyName}`);
        console.log(`   ✅ Status:          ${subaccount.status}\n`);
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        process.exit(1);
    }

    // ─── Step 2: Purchase a phone number for MajorPremium ───
    console.log("2️⃣  Purchasing a local number for MajorPremium...");
    const subClient = require("twilio")(subaccount.sid, subaccount.authToken);
    let purchasedNumber;
    try {
        // Search for available numbers in area code 725 (Las Vegas area for Major Premium)
        const available = await subClient.availablePhoneNumbers("US")
            .local.list({
                areaCode: "725",
                smsEnabled: true,
                voiceEnabled: true,
                limit: 1,
            });

        if (available.length === 0) {
            // Fallback: try 702 (also Las Vegas)
            const fallback = await subClient.availablePhoneNumbers("US")
                .local.list({
                    areaCode: "702",
                    smsEnabled: true,
                    voiceEnabled: true,
                    limit: 1,
                });
            if (fallback.length === 0) {
                console.warn("   ⚠️  No numbers available in 725/702. Skipping purchase.");
                console.log("   → Purchase manually in Twilio console\n");
            } else {
                purchasedNumber = await subClient.incomingPhoneNumbers.create({
                    phoneNumber: fallback[0].phoneNumber,
                    friendlyName: "MajorPremium Main",
                    smsUrl: "https://majorpremium.com/api/webhooks/sms",
                    smsMethod: "POST",
                    voiceUrl: "https://majorpremium.com/api/webhooks/voice",
                    voiceMethod: "POST",
                });
            }
        } else {
            purchasedNumber = await subClient.incomingPhoneNumbers.create({
                phoneNumber: available[0].phoneNumber,
                friendlyName: "MajorPremium Main",
                smsUrl: "https://majorpremium.com/api/webhooks/sms",
                smsMethod: "POST",
                voiceUrl: "https://majorpremium.com/api/webhooks/voice",
                voiceMethod: "POST",
            });
        }

        if (purchasedNumber) {
            console.log(`   ✅ Number:    ${purchasedNumber.phoneNumber}`);
            console.log(`   ✅ SID:       ${purchasedNumber.sid}`);
            console.log(`   ✅ SMS URL:   https://majorpremium.com/api/webhooks/sms`);
            console.log(`   ✅ Voice URL: https://majorpremium.com/api/webhooks/voice\n`);
        }
    } catch (err) {
        console.error(`   ❌ Number purchase failed: ${err.message}`);
        console.log("   → You can purchase manually in Twilio console\n");
    }

    // ─── Step 3: Output new env vars for MajorPremium ───
    console.log("═══════════════════════════════════════════");
    console.log("  NEW ENV VARS FOR MAJORPREMIUM .env.local");
    console.log("═══════════════════════════════════════════\n");
    console.log(`TWILIO_ACCOUNT_SID=${subaccount.sid}`);
    console.log(`TWILIO_AUTH_TOKEN=${subaccount.authToken}`);
    if (purchasedNumber) {
        console.log(`TWILIO_PHONE_NUMBER=${purchasedNumber.phoneNumber}`);
    } else {
        console.log(`TWILIO_PHONE_NUMBER=<purchase manually in Twilio console>`);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("  TRYHUSTLEAI KEEPS THESE (NO CHANGE)");
    console.log("═══════════════════════════════════════════\n");
    console.log(`TWILIO_ACCOUNT_SID=${MASTER_SID}`);
    console.log(`TWILIO_AUTH_TOKEN=${MASTER_TOKEN}`);
    console.log(`TWILIO_PHONE_NUMBER=+18669611068`);

    console.log("\n═══════════════════════════════════════════");
    console.log("  WEBHOOK MAPPING");
    console.log("═══════════════════════════════════════════\n");
    console.log("  MajorPremium subaccount:");
    console.log(`    SMS → https://majorpremium.com/api/webhooks/sms`);
    console.log(`    Voice → https://majorpremium.com/api/webhooks/voice`);
    console.log("");
    console.log("  TryHustleAI master account:");
    console.log(`    SMS → https://tryhustleai.com/api/twilio/sms`);
    console.log(`    Voice → https://tryhustleai.com/api/twilio/voice`);
    console.log(`    Status → https://tryhustleai.com/api/twilio/status`);

    console.log("\n═══════════════════════════════════════════");
    console.log("  NEXT STEPS");
    console.log("═══════════════════════════════════════════\n");
    console.log("  1. Copy new Twilio creds to MajorPremium .env.local");
    console.log("  2. Deploy MajorPremium: cd 'Major Premium LLC web' && vercel --prod");
    console.log("  3. Verify: curl https://majorpremium.com/api/health");
    console.log("  4. Test SMS to new MajorPremium number");
    console.log("  5. Old shared number (+18669611068) now belongs ONLY to TryHustleAI\n");
}

main().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
