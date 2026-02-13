/**
 * HustleAI — Company Profile API
 * GET/PATCH company information and AI configuration.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — Fetch company profile
export async function GET() {
    const companyId = await getCompanyId();

    // Fallback: single-tenant mode
    let company;
    if (companyId) {
        company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { subscription: true },
        });
    } else {
        company = await prisma.company.findFirst({
            include: { subscription: true },
        });
    }

    if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
        company: {
            id: company.id,
            name: company.name,
            phone: company.phone,
            email: company.email,
            address: company.address,
            serviceArea: company.serviceArea,
            industry: company.industry,
            logo: company.logo,
            website: company.website,
            aiGreeting: company.aiGreeting,
            aiTone: company.aiTone,
            aiServices: company.aiServices,
            aiEscalationMsg: company.aiEscalationMsg,
            aiPricingMsg: company.aiPricingMsg,
            voiceId: company.voiceId,
            voiceProvider: company.voiceProvider,
            whiteLabelConfig: company.whiteLabelConfig,
            onboardingDone: company.onboardingDone,
        },
        subscription: company.subscription ? {
            plan: company.subscription.plan,
            interval: company.subscription.interval,
            status: company.subscription.status,
            leadsUsed: company.subscription.leadsUsed,
            leadsLimit: company.subscription.leadsLimit,
            currentPeriodStart: company.subscription.currentPeriodStart,
            currentPeriodEnd: company.subscription.currentPeriodEnd,
        } : null,
    });
}

// PATCH — Update company info and/or AI settings
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Build update data — only include fields that were sent
        const updateData = {};
        const allowedFields = [
            "name", "phone", "email", "address", "serviceArea",
            "industry", "logo", "website",
            "aiGreeting", "aiTone", "aiServices",
            "aiEscalationMsg", "aiPricingMsg",
            "voiceId", "voiceProvider", "whiteLabelConfig",
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const company = await prisma.company.update({
            where: { id: companyId },
            data: updateData,
        });

        return NextResponse.json({ success: true, company });
    } catch (err) {
        console.error("[Company] PATCH error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
