/**
 * HustleAI — Outreach Campaigns API
 * CRUD for automated outreach campaigns + contacts.
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

// GET — List all campaigns with contacts
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ campaigns: [], contacts: [] });

    const campaigns = await prisma.outreachCampaign.findMany({
        where: { companyId },
        include: { contacts: { orderBy: { updatedAt: "desc" }, take: 20 } },
        orderBy: { updatedAt: "desc" },
    });

    // Aggregate stats
    const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
    const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0);
    const totalReplied = campaigns.reduce((s, c) => s + c.replied, 0);
    const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0);

    // Flatten all contacts for "recent contacts" view
    const recentContacts = campaigns
        .flatMap((c) => c.contacts.map((ct) => ({ ...ct, campaignName: c.name })))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10);

    return NextResponse.json({
        campaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            channel: c.channel,
            status: c.status,
            sent: c.sent,
            opened: c.opened,
            replied: c.replied,
            converted: c.converted,
        })),
        recentContacts,
        stats: {
            totalSent,
            openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0",
            replyRate: totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0",
            totalConverted,
        },
    });
}

// POST — Create a new campaign
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, channel } = await request.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const campaign = await prisma.outreachCampaign.create({
        data: {
            companyId,
            name,
            channel: channel || "Email + SMS",
            status: "draft",
        },
    });

    return NextResponse.json(campaign, { status: 201 });
}

// PATCH — Update campaign status
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, name, channel } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Verify ownership
    const existing = await prisma.outreachCampaign.findFirst({
        where: { id, companyId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (channel) updateData.channel = channel;

    const campaign = await prisma.outreachCampaign.update({
        where: { id },
        data: updateData,
    });

    return NextResponse.json(campaign);
}

// DELETE — Remove a campaign
export async function DELETE(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.outreachCampaign.findFirst({
        where: { id, companyId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.outreachCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
