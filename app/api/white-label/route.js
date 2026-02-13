/**
 * HustleAI — White-Label Configuration API
 * Manage company branding for white-label deployments.
 * Business plan only.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkFeature } from "@/lib/plan-limits";

async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — Fetch current white-label config
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await checkFeature(companyId, "whiteLabel");
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { whiteLabelConfig: true, logo: true, name: true },
    });

    let config = {
        logo: company?.logo || null,
        primaryColor: "#0a0a1a",
        accentColor: "#00d2ff",
        companyName: company?.name || "",
        customDomain: null,
        faviconUrl: null,
        headerText: null,
    };

    // Parse saved config
    if (company?.whiteLabelConfig) {
        try {
            const saved = JSON.parse(company.whiteLabelConfig);
            config = { ...config, ...saved };
        } catch (e) { /* use defaults */ }
    }

    return NextResponse.json({
        available: featureCheck.allowed,
        config,
    });
}

// PATCH — Update white-label config
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await checkFeature(companyId, "whiteLabel");
    if (!featureCheck.allowed) {
        return NextResponse.json({
            error: "White-label is only available on the Business plan",
            details: featureCheck.reason,
        }, { status: 403 });
    }

    const body = await request.json();

    const config = {
        logo: body.logo || null,
        primaryColor: body.primaryColor || "#0a0a1a",
        accentColor: body.accentColor || "#00d2ff",
        companyName: body.companyName || "",
        customDomain: body.customDomain || null,
        faviconUrl: body.faviconUrl || null,
        headerText: body.headerText || null,
    };

    await prisma.company.update({
        where: { id: companyId },
        data: {
            whiteLabelConfig: JSON.stringify(config),
            ...(body.logo && { logo: body.logo }),
        },
    });

    return NextResponse.json({ success: true, config });
}
