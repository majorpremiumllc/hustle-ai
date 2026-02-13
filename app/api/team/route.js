/**
 * HustleAI — Team Management API
 * Invite, list, and remove team members for a company.
 * Enforces plan limits for team size.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/plan-limits";

async function getSession() {
    try {
        return await getServerSession(authOptions);
    } catch (e) {
        // Fallback: single-tenant mode
        const company = await prisma.company.findFirst();
        if (company) {
            return { user: { companyId: company.id, role: "owner", id: "dev" } };
        }
        return null;
    }
}

// GET — List all team members and pending invites
export async function GET() {
    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [members, invites, limitInfo] = await Promise.all([
        prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.teamInvite.findMany({
            where: { companyId, status: "pending" },
            orderBy: { createdAt: "desc" },
        }),
        checkLimit(companyId, "teamMembers"),
    ]);

    return NextResponse.json({
        members,
        invites,
        limit: limitInfo.limit,
        used: limitInfo.used,
        canInvite: limitInfo.allowed,
    });
}

// POST — Invite a new team member
export async function POST(request) {
    const session = await getSession();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role;

    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners and admins can invite
    if (userRole !== "owner" && userRole !== "admin") {
        return NextResponse.json({ error: "Only owners and admins can invite team members" }, { status: 403 });
    }

    // Check team member limit
    const limitCheck = await checkLimit(companyId, "teamMembers");
    if (!limitCheck.allowed) {
        return NextResponse.json({
            error: "Team member limit reached",
            details: limitCheck.reason,
            used: limitCheck.used,
            limit: limitCheck.limit,
        }, { status: 429 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists in this company
    const existingUser = await prisma.user.findFirst({
        where: { email, companyId },
    });
    if (existingUser) {
        return NextResponse.json({ error: "This user is already a team member" }, { status: 409 });
    }

    // Check if invite already exists
    const existingInvite = await prisma.teamInvite.findFirst({
        where: { email, companyId, status: "pending" },
    });
    if (existingInvite) {
        return NextResponse.json({ error: "An invitation has already been sent to this email" }, { status: 409 });
    }

    try {
        const invite = await prisma.teamInvite.create({
            data: {
                companyId,
                email,
                role: role || "member",
                invitedBy: session.user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // In production, send invite email here:
        // await sendInviteEmail(email, invite.token, company.name);

        console.log(`[Team] Invite sent to ${email} (token: ${invite.token})`);

        return NextResponse.json({
            success: true,
            invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                token: invite.token,
                expiresAt: invite.expiresAt,
            },
        });
    } catch (err) {
        console.error("[Team] Invite error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE — Remove a team member or cancel an invite
export async function DELETE(request) {
    const session = await getSession();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role;

    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "owner" && userRole !== "admin") {
        return NextResponse.json({ error: "Only owners and admins can remove team members" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const inviteId = searchParams.get("inviteId");

    try {
        if (inviteId) {
            // Cancel a pending invite
            await prisma.teamInvite.deleteMany({
                where: { id: inviteId, companyId },
            });
            return NextResponse.json({ success: true, type: "invite_cancelled" });
        }

        if (userId) {
            // Cannot remove yourself
            if (userId === session.user.id) {
                return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
            }

            // Verify user belongs to company
            const user = await prisma.user.findFirst({
                where: { id: userId, companyId },
            });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // Cannot remove the owner
            if (user.role === "owner") {
                return NextResponse.json({ error: "Cannot remove the company owner" }, { status: 400 });
            }

            // Remove user from company
            await prisma.user.update({
                where: { id: userId },
                data: { companyId: null },
            });

            return NextResponse.json({ success: true, type: "member_removed" });
        }

        return NextResponse.json({ error: "userId or inviteId required" }, { status: 400 });
    } catch (err) {
        console.error("[Team] Delete error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
