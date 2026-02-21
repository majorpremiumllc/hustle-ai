/**
 * HustleAI — Client Onboarding API
 * Automated deployment of AI Front Desk for a new client.
 * Creates Twilio subaccount, purchases local number, configures webhooks,
 * and seeds client config in database. Target: < 90 minutes per client.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { encryptTwilioCredentials } from "@/lib/encryption";

// ── POST: Onboard a new client ────────────────
export async function POST(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const {
        businessName,
        industry = "roofing",
        phone,
        email,
        address,
        serviceArea,
        areaCode,
        services = [],
        aiTone = "friendly, professional, helpful",
    } = body;

    // Validate required fields
    if (!businessName || !areaCode) {
        return NextResponse.json(
            { error: "businessName and areaCode are required" },
            { status: 400 }
        );
    }

    console.log(`[Onboard] Starting onboard for "${businessName}" (area code: ${areaCode})`);

    try {
        // Step 1: Create Twilio subaccount
        const { createSubaccount, purchaseLocalNumber } = require("@/lib/twilio-multi");

        let subAccount = null;
        let purchasedNumber = null;

        try {
            subAccount = await createSubaccount(businessName);
            console.log(`[Onboard] ✅ Step 1: Subaccount created — ${subAccount.sid}`);
        } catch (err) {
            console.error(`[Onboard] ⚠️ Subaccount creation failed: ${err.message}`);
            // Continue without subaccount — can be added later
        }

        // Step 2: Purchase local number
        if (subAccount) {
            try {
                purchasedNumber = await purchaseLocalNumber(
                    subAccount.sid,
                    subAccount.authToken,
                    areaCode,
                    businessName
                );
                console.log(`[Onboard] ✅ Step 2: Number purchased — ${purchasedNumber.phoneNumber}`);
            } catch (err) {
                console.error(`[Onboard] ⚠️ Number purchase failed: ${err.message}`);
            }
        }

        // Step 3: Encrypt credentials and create company record in database
        const encrypted = subAccount
            ? encryptTwilioCredentials(subAccount.sid, subAccount.authToken)
            : { twilioSubAccountSid: null, twilioSubAuthToken: null };

        const company = await prisma.company.create({
            data: {
                name: businessName,
                industry,
                phone: phone || purchasedNumber?.phoneNumber || null,
                email: email || null,
                address: address || null,
                serviceArea: serviceArea || `${areaCode} area`,
                aiTone,
                aiServices: JSON.stringify(services.length > 0 ? services : getDefaultServices(industry)),
                aiGreeting: `Hi, thanks for reaching out to ${businessName}! How can we help you today?`,
                aiEscalationMsg: `Let me have our team reach out to you directly with more details.`,
                aiPricingMsg: `We provide FREE on-site estimates — no obligation! Most customers are surprised by how competitive we are.`,
                twilioSubAccountSid: encrypted.twilioSubAccountSid,
                twilioSubAuthToken: encrypted.twilioSubAuthToken,
                missedCallTextBack: true,
                missedCallMessage: `Hi! Sorry we missed your call. This is ${businessName}. How can we help? Reply here or call us back! 😊`,
                onboardingStep: purchasedNumber ? 9 : (subAccount ? 2 : 0),
                onboardingDone: !!purchasedNumber,
            },
        });

        console.log(`[Onboard] ✅ Step 3: Company created — ${company.id}`);

        // Step 4: Register phone number in database
        if (purchasedNumber) {
            await prisma.phoneNumber.create({
                data: {
                    companyId: company.id,
                    number: purchasedNumber.phoneNumber,
                    twilioSid: purchasedNumber.sid,
                    label: "Main",
                    voiceEnabled: true,
                    smsEnabled: true,
                },
            });
            console.log(`[Onboard] ✅ Step 4: Phone number registered in DB`);
        }

        // Step 5: Create starter subscription
        await prisma.subscription.create({
            data: {
                companyId: company.id,
                plan: "starter",
                status: "active",
                leadsLimit: 50,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });

        console.log(`[Onboard] ✅ Step 5: Subscription created`);
        console.log(`[Onboard] 🎉 Onboarding complete for "${businessName}"`);

        return NextResponse.json({
            success: true,
            company: {
                id: company.id,
                name: company.name,
                phone: purchasedNumber?.phoneNumber || null,
                industry: company.industry,
                subAccountSid: subAccount?.sid || null,
            },
            steps: {
                subaccount: !!subAccount,
                phoneNumber: !!purchasedNumber,
                database: true,
                subscription: true,
            },
        });
    } catch (err) {
        console.error(`[Onboard] ❌ Error: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── GET: List all onboarded clients ────────────
export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const clients = await prisma.company.findMany({
        include: {
            phoneNumbers: true,
            subscription: true,
            _count: {
                select: {
                    leads: true,
                    conversations: true,
                    callLogs: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const formatted = clients.map((c) => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
        phone: c.phoneNumbers[0]?.number || c.phone || null,
        serviceArea: c.serviceArea,
        plan: c.subscription?.plan || "none",
        status: c.subscription?.status || "inactive",
        hasSubaccount: !!c.twilioSubAccountSid,
        missedCallTextBack: c.missedCallTextBack,
        onboardingDone: c.onboardingDone,
        stats: {
            leads: c._count.leads,
            conversations: c._count.conversations,
            calls: c._count.callLogs,
        },
        createdAt: c.createdAt,
    }));

    return NextResponse.json({ clients: formatted });
}

// ── Default services by industry ────────────────
function getDefaultServices(industry) {
    const defaults = {
        roofing: [
            "Roof Repair",
            "Roof Replacement",
            "Roof Inspection",
            "Shingle Repair",
            "Leak Repair",
            "Gutter Installation",
            "Storm Damage Repair",
            "Commercial Roofing",
        ],
        plumbing: [
            "Pipe Repair",
            "Drain Cleaning",
            "Water Heater",
            "Toilet Repair",
            "Faucet Installation",
            "Leak Detection",
            "Sewer Line",
        ],
        hvac: [
            "AC Repair",
            "AC Installation",
            "Heating Repair",
            "Furnace Installation",
            "Duct Cleaning",
            "Thermostat Installation",
        ],
        handyman: [
            "General Repairs",
            "Drywall",
            "Painting",
            "Plumbing",
            "Electrical",
            "Furniture Assembly",
            "Door/Window Repair",
        ],
    };
    return defaults[industry] || defaults.handyman;
}
