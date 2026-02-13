/**
 * HustleAI — Subscription API
 * Returns current subscription data for the company.
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

// GET — Fetch subscription for current company
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sub = await prisma.subscription.findUnique({
            where: { companyId },
            include: { company: true },
        });

        if (!sub) {
            return NextResponse.json({
                plan: "starter",
                planName: "Starter",
                status: "active",
                interval: "month",
                price: "$49",
                leadsUsed: 0,
                leadsLimit: 100,
                stripeCustomerId: null,
            });
        }

        const prices = {
            starter: { month: "$49", year: "$470" },
            professional: { month: "$99", year: "$948" },
            business: { month: "$199", year: "$1,908" },
        };
        const planNames = { starter: "Starter", professional: "Professional", business: "Business" };

        return NextResponse.json({
            plan: sub.plan,
            planName: planNames[sub.plan] || sub.plan,
            status: sub.status,
            interval: sub.interval,
            price: prices[sub.plan]?.[sub.interval] || "$49",
            leadsUsed: sub.leadsUsed,
            leadsLimit: sub.leadsLimit,
            stripeCustomerId: sub.stripeCustomerId,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            trialEnd: sub.status === "trialing" ? sub.currentPeriodEnd : null,
        });
    } catch (err) {
        console.error("[Subscription API] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
