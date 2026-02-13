/**
 * HustleAI — Accept Team Invitation
 * Public route (no auth required) — accepts an invite token and creates a user account.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { token, name, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        // Find the invitation
        const invite = await prisma.teamInvite.findUnique({
            where: { token },
            include: { company: true },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invalid invitation link" }, { status: 404 });
        }

        if (invite.status !== "pending") {
            return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "expired" },
            });
            return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invite.email },
        });

        if (existingUser) {
            // User exists — just link them to the company
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    companyId: invite.companyId,
                    role: invite.role,
                },
            });

            await prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "accepted" },
            });

            return NextResponse.json({
                success: true,
                message: "You've been added to the team!",
                userId: existingUser.id,
            });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name: name || invite.email.split("@")[0],
                email: invite.email,
                hashedPassword,
                role: invite.role,
                companyId: invite.companyId,
            },
        });

        await prisma.teamInvite.update({
            where: { id: invite.id },
            data: { status: "accepted" },
        });

        return NextResponse.json({
            success: true,
            message: `Welcome to ${invite.company.name}!`,
            userId: user.id,
        });
    } catch (err) {
        console.error("[Team Accept] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
