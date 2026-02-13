/**
 * HustleAI — Market Analysis API
 * CRUD for market opportunities (businesses with automation gaps).
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

// GET — List all market opportunities
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ opportunities: [], stats: {} });

    const opportunities = await prisma.marketOpportunity.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // Parse issues from JSON
    const formatted = opportunities.map((o) => {
        let issues = [];
        try { issues = JSON.parse(o.issues || "[]"); } catch (e) { /* */ }
        return { ...o, issues };
    });

    // Build industry stats
    const industryMap = {};
    formatted.forEach((o) => {
        const ind = o.industry || "Other";
        if (!industryMap[ind]) industryMap[ind] = { found: 0, withGaps: 0 };
        industryMap[ind].found++;
        if (o.issues.length > 0) industryMap[ind].withGaps++;
    });

    const industryStats = Object.entries(industryMap).map(([industry, s]) => ({
        industry,
        found: s.found,
        withGaps: s.withGaps,
    }));

    const totalScanned = formatted.length;
    const withGaps = formatted.filter((o) => o.issues.length > 0).length;
    const contacted = formatted.filter((o) => o.contacted).length;

    return NextResponse.json({
        opportunities: formatted,
        industryStats,
        stats: {
            totalScanned,
            withGaps,
            contacted,
        },
    });
}

// POST — Add a new opportunity
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { business, location, industry, source, potential, issues } = await request.json();
    if (!business) return NextResponse.json({ error: "business is required" }, { status: 400 });

    const opp = await prisma.marketOpportunity.create({
        data: {
            companyId,
            business,
            location: location || "",
            industry: industry || "General",
            source: source || "Google",
            potential: potential || "Medium",
            issues: JSON.stringify(issues || []),
        },
    });

    return NextResponse.json(opp, { status: 201 });
}

// PATCH — Mark as contacted
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, contacted } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.marketOpportunity.findFirst({
        where: { id, companyId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const opp = await prisma.marketOpportunity.update({
        where: { id },
        data: { contacted: contacted !== undefined ? contacted : true },
    });

    return NextResponse.json(opp);
}
