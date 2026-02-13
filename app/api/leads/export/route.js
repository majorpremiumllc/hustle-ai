/**
 * HustleAI — Leads CSV Export
 * Exports all leads as a downloadable CSV file.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkFeature } from "@/lib/plan-limits";

export async function GET(request) {
    // Get company
    let companyId = null;
    try {
        const session = await getServerSession(authOptions);
        companyId = session?.user?.companyId;
    } catch (e) { /* */ }

    if (!companyId) {
        const company = await prisma.company.findFirst();
        if (!company) {
            return new Response("No company found", { status: 404 });
        }
        companyId = company.id;
    }

    // Check plan feature
    const featureCheck = await checkFeature(companyId, "crmExport");
    if (!featureCheck.allowed) {
        return Response.json({
            error: "CRM export is not available on your plan",
            details: featureCheck.reason,
        }, { status: 403 });
    }

    // Parse date filters from query params
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = { companyId };
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    const leads = await prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
        "Name", "Phone", "Email", "Job Type",
        "Address", "Urgency", "Preferred Date",
        "Source", "Status", "Notes",
        "Estimated Value", "Created At",
    ];

    const rows = leads.map((lead) => [
        escapeCsv(lead.customerName || ""),
        escapeCsv(lead.customerPhone || ""),
        escapeCsv(lead.customerEmail || ""),
        escapeCsv(lead.jobType || ""),
        escapeCsv(lead.address || ""),
        escapeCsv(lead.urgency || ""),
        escapeCsv(lead.preferredDate || ""),
        escapeCsv(lead.source || ""),
        escapeCsv(lead.status || ""),
        escapeCsv(lead.notes || ""),
        lead.estimatedValue || "",
        lead.createdAt.toISOString(),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

function escapeCsv(val) {
    if (typeof val !== "string") return val;
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}
