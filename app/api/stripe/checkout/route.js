import Stripe from "stripe";
import { PLAN_CONFIG } from "@/lib/stripe-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Create Checkout Session ───────────────────────────────

export async function POST(request) {
    try {
        const { planName, interval, email } = await request.json();

        if (!planName || !interval) {
            return Response.json({ error: "planName and interval required" }, { status: 400 });
        }

        const planId = planName.toLowerCase();
        const plan = PLAN_CONFIG[planId];

        if (!plan) {
            return Response.json({ error: "Invalid plan" }, { status: 400 });
        }

        const pricing = interval === "year" ? plan.yearly : plan.monthly;

        // Create the checkout session with inline price
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `HustleAI ${plan.name}`,
                            description: `HustleAI ${plan.name} Plan — ${interval === "year" ? "Annual" : "Monthly"} billing`,
                        },
                        unit_amount: pricing.amount,
                        recurring: {
                            interval: pricing.interval,
                        },
                    },
                    quantity: 1,
                },
            ],
            ...(email && { customer_email: email }),
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    plan: planId,
                    interval: interval,
                },
            },
            success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?payment=success&plan=${planId}`,
            cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/#pricing`,
            metadata: {
                plan: planId,
                interval: interval,
            },
        });

        return Response.json({ url: session.url });
    } catch (err) {
        console.error("[Stripe Checkout] Error:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
