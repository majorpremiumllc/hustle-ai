/**
 * HustleAI — Trial Billing Enforcement
 * Checks trial expiration and auto-disables service.
 * 
 * Run as cron: node scripts/check-trials.js
 * Or call via API: GET /api/admin/check-trials
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const results = await checkAndExpireTrials();
    return NextResponse.json(results);
}

export async function checkAndExpireTrials() {
    const now = new Date();

    // Find all trialing subscriptions past their end date
    const expiredTrials = await prisma.subscription.findMany({
        where: {
            status: "trialing",
            currentPeriodEnd: { lte: now },
        },
        include: {
            company: { select: { id: true, name: true, phone: true } },
        },
    });

    const results = {
        checked: await prisma.subscription.count({ where: { status: "trialing" } }),
        expired: [],
        active: [],
    };

    for (const sub of expiredTrials) {
        // Auto-disable: set status to "past_due" (not canceled — they can still reactivate)
        await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "past_due" },
        });

        console.log(`[Billing] ⏰ Trial expired for "${sub.company.name}" — set to past_due`);

        results.expired.push({
            companyId: sub.company.id,
            name: sub.company.name,
            expiredAt: sub.currentPeriodEnd.toISOString(),
            plan: sub.plan,
        });
    }

    // Also list active trials with days remaining
    const activeTrials = await prisma.subscription.findMany({
        where: { status: "trialing", currentPeriodEnd: { gt: now } },
        include: { company: { select: { id: true, name: true } } },
    });

    for (const sub of activeTrials) {
        const daysLeft = Math.ceil((sub.currentPeriodEnd - now) / (24 * 60 * 60 * 1000));
        results.active.push({
            companyId: sub.company.id,
            name: sub.company.name,
            daysLeft,
            expiresAt: sub.currentPeriodEnd.toISOString(),
        });
    }

    console.log(`[Billing] Trial check: ${results.expired.length} expired, ${results.active.length} active`);
    return results;
}
