import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
            console.log("[Stripe] ✅ Checkout completed:", {
                customer: session.customer,
                subscription: session.subscription,
                email: session.customer_email,
                plan: session.metadata?.plan,
            });
            // TODO: Update database subscription record
            // await prisma.subscription.upsert(...)
            break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const subscription = event.data.object;
            console.log(`[Stripe] 📋 Subscription ${event.type}:`, {
                id: subscription.id,
                status: subscription.status,
                plan: subscription.metadata?.plan,
            });
            // TODO: Update subscription status in database
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            console.log("[Stripe] ❌ Subscription cancelled:", subscription.id);
            // TODO: Mark subscription as cancelled in database
            break;
        }

        case "invoice.payment_succeeded": {
            const invoice = event.data.object;
            console.log("[Stripe] 💰 Payment succeeded:", {
                amount: invoice.amount_paid,
                customer: invoice.customer,
            });
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object;
            console.log("[Stripe] ⚠️ Payment failed:", {
                customer: invoice.customer,
                attempt: invoice.attempt_count,
            });
            // TODO: Notify user about failed payment
            break;
        }

        default:
            console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return Response.json({ received: true });
}
