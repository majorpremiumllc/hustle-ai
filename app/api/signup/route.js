import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { name, email, password, companyName } = await request.json();

        if (!email || !password || !companyName) {
            return NextResponse.json(
                { error: "Email, password, and company name are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create company + user + starter subscription in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    aiServices: JSON.stringify([
                        "TV mounting",
                        "Drywall repair",
                        "Painting",
                        "Flooring repair",
                        "Door repair / replacement",
                        "Furniture assembly",
                        "General handyman services",
                    ]),
                },
            });

            const user = await tx.user.create({
                data: {
                    name: name || companyName,
                    email,
                    hashedPassword,
                    role: "owner",
                    companyId: company.id,
                },
            });

            const subscription = await tx.subscription.create({
                data: {
                    companyId: company.id,
                    plan: "starter",
                    interval: "month",
                    status: "trialing",
                    leadsLimit: 50,
                    currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day trial
                },
            });

            return { user, company, subscription };
        });

        return NextResponse.json({
            success: true,
            userId: result.user.id,
            companyId: result.company.id,
        });
    } catch (error) {
        console.error("[Signup]", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
