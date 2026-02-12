import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Billing Portal ───────────────────────────────────────
// Creates a Stripe Customer Portal session for managing subscriptions

export async function POST(request) {
    try {
        const { customerId } = await request.json();

        if (!customerId) {
            return Response.json({ error: "customerId required" }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/settings`,
        });

        return Response.json({ url: session.url });
    } catch (err) {
        console.error("[Stripe Billing] Error:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
