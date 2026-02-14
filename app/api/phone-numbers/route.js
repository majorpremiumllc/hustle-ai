/**
 * HustleAI — Phone Numbers API
 * Manage Twilio phone numbers for a company.
 * Enforces plan limits for number of phone numbers.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/plan-limits";

async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — List all phone numbers for the company
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const numbers = await prisma.phoneNumber.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
    });

    // Get plan limit info
    const limitInfo = await checkLimit(companyId, "phoneNumbers");

    return NextResponse.json({
        numbers,
        limit: limitInfo.limit,
        used: limitInfo.used,
        canAdd: limitInfo.allowed,
    });
}

// POST — Add (provision) a new phone number
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check phone number limits
    const limitCheck = await checkLimit(companyId, "phoneNumbers");
    if (!limitCheck.allowed) {
        return NextResponse.json({
            error: "Phone number limit reached",
            details: limitCheck.reason,
            used: limitCheck.used,
            limit: limitCheck.limit,
        }, { status: 429 });
    }

    const body = await request.json();
    const { number, label, voiceEnabled, smsEnabled } = body;

    if (!number) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Check if number already exists
    const existing = await prisma.phoneNumber.findUnique({ where: { number } });
    if (existing) {
        return NextResponse.json({ error: "This number is already registered" }, { status: 409 });
    }

    try {
        // Provision number via Twilio API
        const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://tryhustleai.com";
        const twilioNumber = await twilio.incomingPhoneNumbers.create({
            phoneNumber: number,
            voiceUrl: `${baseUrl}/api/twilio/voice`,
            voiceMethod: "POST",
            smsUrl: `${baseUrl}/api/twilio/sms`,
            smsMethod: "POST",
            friendlyName: `HustleAI - ${label || "Main"}`,
        });

        const phoneNumber = await prisma.phoneNumber.create({
            data: {
                companyId,
                number,
                label: label || "Main",
                voiceEnabled: voiceEnabled !== false,
                smsEnabled: smsEnabled !== false,
                twilioSid: twilioNumber.sid,
            },
        });

        return NextResponse.json({ success: true, phoneNumber });
    } catch (err) {
        console.error("[PhoneNumbers] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE — Remove a phone number
export async function DELETE(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const numberId = searchParams.get("id");

    if (!numberId) {
        return NextResponse.json({ error: "Phone number ID required" }, { status: 400 });
    }

    // Ensure the number belongs to this company
    const existing = await prisma.phoneNumber.findFirst({
        where: { id: numberId, companyId },
    });

    if (!existing) {
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    try {
        // Release the Twilio number
        if (existing.twilioSid) {
            const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await twilio.incomingPhoneNumbers(existing.twilioSid).remove();
        }

        await prisma.phoneNumber.delete({ where: { id: numberId } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PhoneNumbers] Delete error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
