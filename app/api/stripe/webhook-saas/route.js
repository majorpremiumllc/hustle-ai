/**
 * HustleAI — SaaS-Only Stripe Webhook
 * Processes ONLY events tagged with project=tryhustleai metadata.
 * MajorPremium events are silently ignored.
 * 
 * Endpoint: /api/stripe/webhook-saas
 * 
 * Events handled:
 *   checkout.session.completed  → Create/update subscription
 *   customer.subscription.*     → Sync subscription status
 *   invoice.payment_succeeded   → Reset leads, mark active
 *   invoice.payment_failed      → Mark past_due
 */

import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_SAAS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

const PROJECT_TAG = "tryhustleai";

const PLAN_LIMITS = {
    starter: { leadsLimit: 50, phoneNumbers: 1 },
    professional: { leadsLimit: 250, phoneNumbers: 3 },
    business: { leadsLimit: 999999, phoneNumbers: 10 },
};

// ─── SaaS Webhook Handler ─────────────────────────────
export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event;
    try {
        if (!endpointSecret) {
            console.error("[Stripe-SaaS] Webhook secret not configured");
            return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error("[Stripe-SaaS] Signature verification failed:", err.message);
        return Response.json({ error: "Signature failed" }, { status: 400 });
    }

    // ── PROJECT FILTER: Only process tryhustleai events ──
    const metadata = event.data?.object?.metadata || {};
    const projectTag = metadata.project || metadata.project_id;

    if (projectTag && projectTag !== PROJECT_TAG) {
        // Not our event — let the other webhook handle it
        console.log(`[Stripe-SaaS] Skipping event ${event.type} (project=${projectTag})`);
        return Response.json({ received: true, skipped: true });
    }

    console.log(`[Stripe-SaaS] Processing ${event.type} (project=${projectTag || "untagged"})`);

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const planId = session.metadata?.plan || "starter";
            const interval = session.metadata?.interval || "month";
            const email = session.customer_email || session.customer_details?.email;

            console.log("[Stripe-SaaS] ✅ Checkout:", { email, plan: planId, interval });

            if (email) {
                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { company: true },
                });

                if (user?.companyId) {
                    const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.starter;
                    await prisma.subscription.upsert({
                        where: { companyId: user.companyId },
                        update: {
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            plan: planId,
                            interval,
                            status: "active",
                            leadsLimit: limits.leadsLimit,
                        },
                        create: {
                            companyId: user.companyId,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            plan: planId,
                            interval,
                            status: "active",
                            leadsLimit: limits.leadsLimit,
                        },
                    });
                    console.log(`[Stripe-SaaS] Subscription for ${user.companyId} → ${planId}`);
                }
            }
            break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const sub = event.data.object;
            const planId = sub.metadata?.plan;
            const status = sub.status;

            const existing = await prisma.subscription.findFirst({
                where: { stripeSubscriptionId: sub.id },
            });

            if (existing) {
                const updateData = { status };
                if (planId) {
                    updateData.plan = planId;
                    updateData.leadsLimit = PLAN_LIMITS[planId]?.leadsLimit || 100;
                }
                if (sub.current_period_end) {
                    updateData.currentPeriodEnd = new Date(sub.current_period_end * 1000);
                }
                await prisma.subscription.update({
                    where: { id: existing.id },
                    data: updateData,
                });
                console.log(`[Stripe-SaaS] Synced ${sub.id} → ${status}`);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object;
            const existing = await prisma.subscription.findFirst({
                where: { stripeSubscriptionId: sub.id },
            });

            if (existing) {
                await prisma.subscription.update({
                    where: { id: existing.id },
                    data: {
                        status: "canceled",
                        plan: "starter",
                        leadsLimit: 50,
                        stripeSubscriptionId: null,
                    },
                });
                console.log(`[Stripe-SaaS] ❌ Canceled → downgraded ${existing.companyId}`);
            }
            break;
        }

        case "invoice.payment_succeeded": {
            const invoice = event.data.object;
            if (invoice.billing_reason === "subscription_cycle") {
                const sub = await prisma.subscription.findFirst({
                    where: { stripeCustomerId: invoice.customer },
                });
                if (sub) {
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: { leadsUsed: 0, status: "active" },
                    });
                    console.log(`[Stripe-SaaS] 💰 Reset leads for ${sub.companyId}`);
                }
            }
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object;
            const sub = await prisma.subscription.findFirst({
                where: { stripeCustomerId: invoice.customer },
            });
            if (sub) {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: "past_due" },
                });
                console.log(`[Stripe-SaaS] ⚠️ Past due: ${sub.companyId}`);
            }
            break;
        }

        default:
            console.log(`[Stripe-SaaS] Unhandled: ${event.type}`);
    }

    return Response.json({ received: true, project: PROJECT_TAG });
}
