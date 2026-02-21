/**
 * HustleAI — Universal Client Onboarding API
 * Supports two modes:
 *   A) "We Provide the Number" — buy via Twilio master/subaccount
 *   B) "Bring Your Own Twilio (BYOT)" — client provides their Twilio creds
 * 
 * POST /api/clients/onboard-universal
 * 
 * Body (Mode A):
 *   { mode: "managed", businessName, email, phone, areaCode, industry, plan, trialDays }
 * 
 * Body (Mode B - BYOT):
 *   { mode: "byot", businessName, email, phone, industry, plan, trialDays,
 *     twilioSid, twilioToken, twilioNumber }
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { encryptTwilioCredentials } from "@/lib/encryption";

const INDUSTRY_DEFAULTS = {
    roofing: {
        services: ["Roof Repair", "Roof Replacement", "Inspection", "Leak Repair", "Storm Damage", "Emergency Tarping", "Gutter Install", "Metal Roofing"],
        tone: "professional, confident, knowledgeable",
        greeting: (name) => `Hey! Thanks for reaching out to ${name}! Looking for a roof repair, replacement, or inspection? We'd love to help.`,
        missedCall: (name) => `Sorry we missed your call! This is ${name}. Are you looking for a roof repair or estimate? Reply here and we'll get right back to you!`,
        afterHours: (name, phone) => `Thanks for reaching out to ${name}! We're currently closed but will get back to you first thing. For emergencies, call ${phone}.`,
        pricing: "Every project is different — we offer FREE estimates with zero obligation.",
        escalation: "Let me have our team reach out with a full proposal.",
    },
    plumbing: {
        services: ["Pipe Repair", "Drain Cleaning", "Water Heater", "Leak Detection", "Sewer Line", "Fixture Install", "Emergency Service"],
        tone: "professional, reliable, responsive",
        greeting: (name) => `Hi! Thanks for texting ${name}! Do you have a plumbing emergency or need to schedule a service? We're here to help.`,
        missedCall: (name) => `Hi, this is ${name}. Sorry we missed your call — are you dealing with a plumbing issue? Reply here and we'll help right away!`,
        afterHours: (name, phone) => `Thanks for contacting ${name}! We're closed now but for emergencies call ${phone} — we have 24/7 service.`,
        pricing: "We provide upfront pricing with no hidden fees. Service calls start at $89.",
        escalation: "Let me get one of our licensed plumbers to call you directly.",
    },
    hvac: {
        services: ["AC Repair", "Heating Repair", "Installation", "Maintenance", "Duct Work", "Indoor Air Quality", "Emergency Service"],
        tone: "professional, knowledgeable, helpful",
        greeting: (name) => `Hi! You've reached ${name}. Need AC or heating help? Tell us what's going on and we'll get you taken care of.`,
        missedCall: (name) => `Hi, ${name} here. Sorry we missed you! Having an AC or heating issue? Reply with details and we'll get right on it.`,
        afterHours: (name, phone) => `${name} is currently closed. For emergency HVAC service, call ${phone}.`,
        pricing: "Diagnostic visits start at $79. We always provide a quote before any work begins.",
        escalation: "I'll have our senior technician reach out to schedule your visit.",
    },
    general: {
        services: ["Consultation", "Service", "Repair", "Installation", "Maintenance"],
        tone: "professional, friendly, helpful",
        greeting: (name) => `Hi! Thanks for reaching out to ${name}! How can we help you today?`,
        missedCall: (name) => `Hi! Sorry we missed your call. This is ${name}. Reply here and we'll get right back to you!`,
        afterHours: (name, phone) => `Thanks for reaching ${name}! We're currently closed but will respond ASAP. For urgent matters, call ${phone}.`,
        pricing: "We provide free estimates. Every project is different — let's discuss your needs.",
        escalation: "Let me have someone from our team reach out to you directly.",
    },
};

// ── POST: Universal Onboarding ──────────────
export async function POST(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const {
        mode = "managed",    // "managed" (A) or "byot" (B)
        businessName,
        email,
        phone,
        areaCode,
        industry = "general",
        plan = "starter",
        trialDays = 14,
        // BYOT fields
        twilioSid,
        twilioToken,
        twilioNumber,
    } = body;

    if (!businessName) {
        return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const defaults = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS.general;
    console.log(`[Onboard] Starting ${mode} onboard: "${businessName}" (${industry})`);

    let subAccount = null;
    let purchasedNumber = null;
    let clientTwilioSid = null;
    let clientTwilioToken = null;
    let clientPhoneNumber = null;

    try {
        if (mode === "byot") {
            // ── MODE B: Bring Your Own Twilio ──
            if (!twilioSid || !twilioToken || !twilioNumber) {
                return NextResponse.json({
                    error: "BYOT mode requires twilioSid, twilioToken, and twilioNumber",
                }, { status: 400 });
            }

            // Validate BYOT credentials
            try {
                const twilio = require("twilio")(twilioSid, twilioToken);
                const acct = await twilio.api.accounts(twilioSid).fetch();
                console.log(`[Onboard] ✅ BYOT Twilio verified: ${acct.friendlyName}`);
            } catch (err) {
                return NextResponse.json({
                    error: `Invalid Twilio credentials: ${err.message}`,
                }, { status: 400 });
            }

            // Configure webhooks on their number
            try {
                const twilio = require("twilio")(twilioSid, twilioToken);
                const numbers = await twilio.incomingPhoneNumbers.list({ phoneNumber: twilioNumber });
                if (numbers.length > 0) {
                    const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";
                    await twilio.incomingPhoneNumbers(numbers[0].sid).update({
                        smsUrl: `${BASE}/api/twilio/sms`,
                        smsMethod: "POST",
                        voiceUrl: `${BASE}/api/twilio/voice`,
                        voiceMethod: "POST",
                        statusCallback: `${BASE}/api/twilio/status`,
                        statusCallbackMethod: "POST",
                    });
                    console.log(`[Onboard] ✅ BYOT webhooks configured for ${twilioNumber}`);
                }
            } catch (err) {
                console.warn(`[Onboard] ⚠️ Webhook config failed: ${err.message}`);
            }

            clientTwilioSid = twilioSid;
            clientTwilioToken = twilioToken;
            clientPhoneNumber = twilioNumber;

        } else {
            // ── MODE A: We Provide the Number ──
            try {
                const { createSubaccount, purchaseLocalNumber } = require("@/lib/twilio-multi");
                subAccount = await createSubaccount(businessName);
                console.log(`[Onboard] ✅ Subaccount: ${subAccount.sid}`);

                if (areaCode) {
                    purchasedNumber = await purchaseLocalNumber(subAccount.sid, subAccount.authToken, areaCode, businessName);
                    console.log(`[Onboard] ✅ Number: ${purchasedNumber.phoneNumber}`);
                }

                clientTwilioSid = subAccount.sid;
                clientTwilioToken = subAccount.authToken;
                clientPhoneNumber = purchasedNumber?.phoneNumber;
            } catch (err) {
                console.warn(`[Onboard] ⚠️ Twilio setup: ${err.message}`);
                // Continue — client can add Twilio later
            }
        }

        // Encrypt credentials
        const encrypted = clientTwilioSid && clientTwilioToken
            ? encryptTwilioCredentials(clientTwilioSid, clientTwilioToken)
            : { twilioSubAccountSid: null, twilioSubAuthToken: null };

        // Create company
        const company = await prisma.company.create({
            data: {
                name: businessName,
                industry,
                phone: phone || clientPhoneNumber || null,
                email: email || null,
                aiTone: defaults.tone,
                aiServices: JSON.stringify(defaults.services),
                aiGreeting: defaults.greeting(businessName),
                aiEscalationMsg: defaults.escalation,
                aiPricingMsg: defaults.pricing,
                twilioSubAccountSid: encrypted.twilioSubAccountSid,
                twilioSubAuthToken: encrypted.twilioSubAuthToken,
                missedCallTextBack: true,
                missedCallMessage: defaults.missedCall(businessName),
                businessHours: JSON.stringify({
                    mon: { open: "08:00", close: "18:00" },
                    tue: { open: "08:00", close: "18:00" },
                    wed: { open: "08:00", close: "18:00" },
                    thu: { open: "08:00", close: "18:00" },
                    fri: { open: "08:00", close: "18:00" },
                    sat: { open: "09:00", close: "14:00" },
                    sun: { closed: true },
                }),
                emergencyNumber: phone || null,
                language: "en",
                afterHoursMessage: defaults.afterHours(businessName, phone || "us"),
                maxSmsPerDay: plan === "business" ? 500 : plan === "professional" ? 300 : 150,
                onboardingDone: !!clientPhoneNumber,
            },
        });

        // Register phone number
        if (clientPhoneNumber) {
            await prisma.phoneNumber.create({
                data: {
                    companyId: company.id,
                    number: clientPhoneNumber,
                    twilioSid: purchasedNumber?.sid || null,
                    label: "Main",
                    voiceEnabled: true,
                    smsEnabled: true,
                    campaignStatus: mode === "byot" ? "unknown" : "not-registered",
                },
            });
        }

        // Create trial subscription
        const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        await prisma.subscription.create({
            data: {
                companyId: company.id,
                plan,
                status: "trialing",
                leadsLimit: plan === "business" ? 999999 : plan === "professional" ? 250 : 50,
                currentPeriodEnd: trialEnd,
            },
        });

        console.log(`[Onboard] 🎉 "${businessName}" ready! Mode: ${mode} | Plan: ${plan}`);

        return NextResponse.json({
            success: true,
            client: {
                id: company.id,
                name: businessName,
                mode,
                industry,
                phone: clientPhoneNumber,
                plan,
                trial: { days: trialDays, expiresAt: trialEnd.toISOString() },
                steps: {
                    twilio: mode === "byot" ? "byot-connected" : (subAccount ? "subaccount-created" : "pending"),
                    phoneNumber: !!clientPhoneNumber,
                    webhooks: mode === "byot" ? "configured" : (purchasedNumber ? "auto-configured" : "pending"),
                    ai: "configured",
                    subscription: "trialing",
                    tenDlc: mode === "byot" ? "customer-responsibility" : "not-registered",
                },
            },
        });
    } catch (err) {
        console.error(`[Onboard] ❌ Error: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
