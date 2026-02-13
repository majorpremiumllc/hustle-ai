/**
 * HustleAI — Lead Ingest API
 * Receives lead data from any source (Thumbtack, Yelp, manual entry, webhook)
 * and stores it in the Prisma database with plan limit enforcement.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/plan-limits";

// ── Helper: get companyId from session ─────────
async function getCompanyId(request) {
    // Try session first (dashboard calls)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }

    // Try X-Company-Id header (webhook calls)
    const headerCompanyId = request?.headers?.get("x-company-id");
    if (headerCompanyId) return headerCompanyId;

    // Fallback: single-tenant mode — use first company
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — Fetch all leads for the company
export async function GET(request) {
    const companyId = await getCompanyId(request);
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const leads = await prisma.lead.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return NextResponse.json({ leads });
    } catch (err) {
        console.error("[Lead Ingest] GET error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Add a new lead (with plan limit check)
export async function POST(request) {
    try {
        const body = await request.json();
        const companyId = await getCompanyId(request) || body.companyId;

        if (!companyId) {
            return NextResponse.json({ error: "Company ID required" }, { status: 400 });
        }

        // Check lead limit
        const limitCheck = await checkLimit(companyId, "leads");
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: "Lead limit reached",
                details: limitCheck.reason,
                used: limitCheck.used,
                limit: limitCheck.limit,
                plan: limitCheck.plan,
            }, { status: 429 });
        }

        const lead = await prisma.lead.create({
            data: {
                companyId,
                customerName: body.customerName || "Unknown",
                customerPhone: body.customerPhone || "",
                customerEmail: body.customerEmail || null,
                jobType: body.jobType || "General",
                address: body.address || null,
                notes: body.description || body.notes || "",
                urgency: body.urgency || "Flexible",
                source: body.source || "Manual",
                status: "new",
                hasPhotos: body.hasPhotos || false,
                preferredDate: body.preferredDate || null,
                estimatedValue: body.estimatedValue || null,
            },
        });

        // Update leadsUsed count on subscription
        await prisma.subscription.updateMany({
            where: { companyId },
            data: { leadsUsed: { increment: 1 } },
        });

        return NextResponse.json({ success: true, lead });
    } catch (err) {
        console.error("[Lead Ingest] POST error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — Update lead status
export async function PATCH(request) {
    try {
        const companyId = await getCompanyId(request);
        if (!companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, status, aiReply } = await request.json();

        // Verify lead belongs to this company
        const existing = await prisma.lead.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        const lead = await prisma.lead.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(aiReply && { notes: aiReply }),
            },
        });

        return NextResponse.json({ success: true, lead });
    } catch (err) {
        console.error("[Lead Ingest] PATCH error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
