/**
 * HustleAI — Roofing Pilot Client Onboarding Template
 * Pre-configured for roofing businesses with optimized AI scripts.
 * 
 * Usage:
 *   curl -X POST https://tryhustleai.com/api/clients/pilot-onboard \
 *     -H "x-api-key: <ADMIN_API_KEY>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"businessName":"ABC Roofing","phone":"5551234567","email":"owner@abc.com","areaCode":"469"}'
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { encryptTwilioCredentials } from "@/lib/encryption";

// ── Roofing Client Defaults ─────────────────────
const ROOFING_DEFAULTS = {
    industry: "roofing",
    aiTone: "professional, confident, knowledgeable, warm",
    language: "en",
    leadRoutingMode: "auto",
    maxSmsPerDay: 150,
    missedCallTextBack: true,
    businessHours: JSON.stringify({
        mon: { open: "07:00", close: "18:00" },
        tue: { open: "07:00", close: "18:00" },
        wed: { open: "07:00", close: "18:00" },
        thu: { open: "07:00", close: "18:00" },
        fri: { open: "07:00", close: "18:00" },
        sat: { open: "08:00", close: "14:00" },
        sun: { closed: true },
    }),
    afterHoursMessage: null, // auto-generated below
    services: [
        "Roof Repair",
        "Roof Replacement",
        "Roof Inspection",
        "Shingle Repair",
        "Leak Repair",
        "Storm Damage Repair",
        "Gutter Installation",
        "Emergency Tarping",
        "Commercial Roofing",
        "Metal Roofing",
    ],
    aiPricingMsg: "Every roof is different — that's why we offer FREE inspections and estimates with zero obligation. Most homeowners are surprised how affordable we are.",
    aiEscalationMsg: "Let me have our project manager reach out to you directly with a full proposal.",
};

// ── POST: One-click roofing client onboarding ──
export async function POST(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const {
        businessName,
        phone,
        email,
        address,
        serviceArea,
        areaCode,
        ownerName,
        trialDays = 14,
    } = body;

    if (!businessName) {
        return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    console.log(`[Pilot] Starting roofing pilot onboard for "${businessName}"`);

    try {
        // Step 1: Try to create Twilio subaccount + purchase number
        let subAccount = null;
        let purchasedNumber = null;

        try {
            const { createSubaccount, purchaseLocalNumber } = require("@/lib/twilio-multi");
            subAccount = await createSubaccount(businessName);
            console.log(`[Pilot] ✅ Subaccount: ${subAccount.sid}`);

            if (areaCode) {
                purchasedNumber = await purchaseLocalNumber(subAccount.sid, subAccount.authToken, areaCode, businessName);
                console.log(`[Pilot] ✅ Number: ${purchasedNumber.phoneNumber}`);
            }
        } catch (err) {
            console.warn(`[Pilot] ⚠️ Twilio setup failed (will continue): ${err.message}`);
        }

        // Step 2: Encrypt credentials
        const encrypted = subAccount
            ? encryptTwilioCredentials(subAccount.sid, subAccount.authToken)
            : { twilioSubAccountSid: null, twilioSubAuthToken: null };

        // Step 3: Generate custom messages
        const afterHoursMsg = `Thanks for reaching out to ${businessName}! We're currently closed but will get back to you first thing in the morning. For roof emergencies (active leaks, storm damage), call ${phone || "us"} — we have a 24/7 emergency line.`;
        const missedCallMsg = `Hi! Sorry we missed your call. This is ${businessName}. Are you looking for a roof repair, inspection, or estimate? Just reply here and we'll get right back to you!`;
        const greeting = `Hey! Thanks for reaching out to ${businessName}! Are you looking for a roof repair, replacement, or inspection? We'd love to help.`;

        // Step 4: Create company
        const company = await prisma.company.create({
            data: {
                name: businessName,
                industry: ROOFING_DEFAULTS.industry,
                phone: phone || purchasedNumber?.phoneNumber || null,
                email: email || null,
                address: address || null,
                serviceArea: serviceArea || (areaCode ? `${areaCode} area` : "local area"),
                aiTone: ROOFING_DEFAULTS.aiTone,
                aiServices: JSON.stringify(ROOFING_DEFAULTS.services),
                aiGreeting: greeting,
                aiEscalationMsg: ROOFING_DEFAULTS.aiEscalationMsg,
                aiPricingMsg: ROOFING_DEFAULTS.aiPricingMsg,
                twilioSubAccountSid: encrypted.twilioSubAccountSid,
                twilioSubAuthToken: encrypted.twilioSubAuthToken,
                missedCallTextBack: true,
                missedCallMessage: missedCallMsg,
                businessHours: ROOFING_DEFAULTS.businessHours,
                emergencyNumber: phone || null,
                language: ROOFING_DEFAULTS.language,
                leadRoutingMode: ROOFING_DEFAULTS.leadRoutingMode,
                afterHoursMessage: afterHoursMsg,
                maxSmsPerDay: ROOFING_DEFAULTS.maxSmsPerDay,
                onboardingStep: purchasedNumber ? 9 : 0,
                onboardingDone: !!purchasedNumber,
            },
        });

        console.log(`[Pilot] ✅ Company created: ${company.id}`);

        // Step 5: Register phone number
        if (purchasedNumber) {
            await prisma.phoneNumber.create({
                data: {
                    companyId: company.id,
                    number: purchasedNumber.phoneNumber,
                    twilioSid: purchasedNumber.sid,
                    label: "Main",
                    voiceEnabled: true,
                    smsEnabled: true,
                    campaignStatus: "not-registered",
                },
            });
            console.log(`[Pilot] ✅ Phone registered`);
        }

        // Step 6: Create trial subscription
        const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        await prisma.subscription.create({
            data: {
                companyId: company.id,
                plan: "starter",
                status: "trialing",
                leadsLimit: 100,
                currentPeriodEnd: trialEnd,
            },
        });

        console.log(`[Pilot] ✅ Trial subscription created (${trialDays} days)`);
        console.log(`[Pilot] 🎉 Roofing pilot "${businessName}" ready!`);

        return NextResponse.json({
            success: true,
            pilot: {
                id: company.id,
                name: businessName,
                phone: purchasedNumber?.phoneNumber || phone || null,
                industry: "roofing",
                trial: {
                    days: trialDays,
                    expiresAt: trialEnd.toISOString(),
                },
                subAccountSid: subAccount?.sid || null,
                steps: {
                    subaccount: !!subAccount,
                    phoneNumber: !!purchasedNumber,
                    database: true,
                    subscription: true,
                    aiConfigured: true,
                },
                nextSteps: [
                    purchasedNumber ? null : "Provision phone number manually",
                    "Register 10DLC campaign for this number",
                    "Run smoke test: scripts/smoke-test.js",
                    "Send test SMS to verify AI response",
                    "Monitor at /admin/client-monitor",
                ].filter(Boolean),
            },
        });
    } catch (err) {
        console.error(`[Pilot] ❌ Error: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
