import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Plan mapping from Stripe metadata to internal plan names
const PLAN_LIMITS = {
    starter: { leadsLimit: 100 },
    professional: { leadsLimit: 500 },
    business: { leadsLimit: 999999 }, // "unlimited"
};

// ─── Stripe Webhook Handler ───────────────────────────────

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event;

    try {
        if (endpointSecret && endpointSecret !== "whsec_PASTE_WEBHOOK_SECRET_HERE") {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } else {
            // Dev mode — skip signature verification
            event = JSON.parse(body);
        }
    } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return Response.json({ error: "Webhook signature failed" }, { status: 400 });
    }

    // Handle events
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const planId = session.metadata?.plan || "starter";
            const interval = session.metadata?.interval || "month";
            const email = session.customer_email || session.customer_details?.email;

            console.log("[Stripe] ✅ Checkout completed:", {
                customer: session.customer,
                subscription: session.subscription,
                email,
                plan: planId,
            });

            // Find user by email and update their company subscription
            if (email) {
                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { company: true },
                });

                if (user?.companyId) {
                    await prisma.subscription.upsert({
                        where: { companyId: user.companyId },
                        update: {
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            plan: planId,
                            interval,
                            status: "trialing",
                            leadsLimit: PLAN_LIMITS[planId]?.leadsLimit || 100,
                        },
                        create: {
                            companyId: user.companyId,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            plan: planId,
                            interval,
                            status: "trialing",
                            leadsLimit: PLAN_LIMITS[planId]?.leadsLimit || 100,
                        },
                    });
                    console.log(`[Stripe] Updated subscription for company ${user.companyId} → ${planId}`);
                }
            }
            break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const subscription = event.data.object;
            const planId = subscription.metadata?.plan;
            const status = subscription.status; // active, trialing, past_due, canceled, etc.

            console.log(`[Stripe] 📋 Subscription ${event.type}:`, {
                id: subscription.id,
                status,
                plan: planId,
            });

            // Find by stripeSubscriptionId and update
            const existingSub = await prisma.subscription.findFirst({
                where: { stripeSubscriptionId: subscription.id },
            });

            if (existingSub) {
                const updateData = { status };
                if (planId) {
                    updateData.plan = planId;
                    updateData.leadsLimit = PLAN_LIMITS[planId]?.leadsLimit || 100;
                }
                if (subscription.current_period_start) {
                    updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
                }
                if (subscription.current_period_end) {
                    updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                }

                await prisma.subscription.update({
                    where: { id: existingSub.id },
                    data: updateData,
                });
                console.log(`[Stripe] Synced subscription ${subscription.id} → status: ${status}`);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            console.log("[Stripe] ❌ Subscription cancelled:", subscription.id);

            // Downgrade to starter
            const cancelSub = await prisma.subscription.findFirst({
                where: { stripeSubscriptionId: subscription.id },
            });

            if (cancelSub) {
                await prisma.subscription.update({
                    where: { id: cancelSub.id },
                    data: {
                        status: "canceled",
                        plan: "starter",
                        leadsLimit: 100,
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                    },
                });
                console.log(`[Stripe] Downgraded company ${cancelSub.companyId} → starter`);
            }
            break;
        }

        case "invoice.payment_succeeded": {
            const invoice = event.data.object;
            console.log("[Stripe] 💰 Payment succeeded:", {
                amount: invoice.amount_paid,
                customer: invoice.customer,
            });

            // Reset leadsUsed on successful payment (new billing cycle)
            if (invoice.billing_reason === "subscription_cycle") {
                const sub = await prisma.subscription.findFirst({
                    where: { stripeCustomerId: invoice.customer },
                });
                if (sub) {
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: { leadsUsed: 0, status: "active" },
                    });
                    console.log(`[Stripe] Reset leadsUsed for company ${sub.companyId}`);
                }
            }
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object;
            console.log("[Stripe] ⚠️ Payment failed:", {
                customer: invoice.customer,
                attempt: invoice.attempt_count,
            });

            // Mark subscription as past_due
            const failSub = await prisma.subscription.findFirst({
                where: { stripeCustomerId: invoice.customer },
            });
            if (failSub) {
                await prisma.subscription.update({
                    where: { id: failSub.id },
                    data: { status: "past_due" },
                });
            }
            break;
        }

        default:
            console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return Response.json({ received: true });
}
