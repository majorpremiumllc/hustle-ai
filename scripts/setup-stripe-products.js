#!/usr/bin/env node
/**
 * HustleAI — Stripe Product Setup Script
 * Creates SaaS subscription products and pricing in a NEW Stripe account.
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-products.js
 * 
 * Creates:
 *   - Starter ($49/mo)
 *   - Professional ($99/mo)
 *   - Business ($199/mo)
 * 
 * Outputs stripe-config.js price IDs for copy-paste.
 */

async function main() {
    const sk = process.env.STRIPE_SECRET_KEY;
    if (!sk) {
        console.error("❌ Set STRIPE_SECRET_KEY first");
        process.exit(1);
    }

    const stripe = require("stripe")(sk);

    console.log("═══════════════════════════════════════════");
    console.log("  TryHustleAI — Stripe Product Setup");
    console.log("═══════════════════════════════════════════\n");

    // Verify account
    const account = await stripe.accounts.retrieve();
    console.log(`Account: ${account.business_profile?.name || account.email || account.id}\n`);

    const plans = [
        {
            name: "Starter",
            description: "AI Front Desk for small businesses. Up to 50 leads/mo, 1 phone number.",
            monthlyPrice: 4900, // cents
            yearlyPrice: 47000,
            features: ["1 AI Phone Number", "50 Leads/month", "SMS Auto-Reply", "Missed Call Text-Back", "Basic Dashboard"],
        },
        {
            name: "Professional",
            description: "Growing businesses. Up to 200 leads/mo, 3 phone numbers, priority support.",
            monthlyPrice: 9900,
            yearlyPrice: 95000,
            features: ["3 AI Phone Numbers", "200 Leads/month", "Voice AI + SMS AI", "Telecom Health Dashboard", "Weekly Reports", "Priority Support"],
        },
        {
            name: "Business",
            description: "Scale operations. Unlimited leads, 10 phone numbers, dedicated account manager.",
            monthlyPrice: 19900,
            yearlyPrice: 191000,
            features: ["10 AI Phone Numbers", "Unlimited Leads", "Voice + SMS + Outreach", "Command Center", "Custom AI Training", "API Access", "Dedicated Support"],
        },
    ];

    const results = [];

    for (const plan of plans) {
        console.log(`Creating ${plan.name}...`);

        // Create product
        const product = await stripe.products.create({
            name: `HustleAI ${plan.name}`,
            description: plan.description,
            metadata: {
                plan: plan.name.toLowerCase(),
                features: JSON.stringify(plan.features),
            },
        });
        console.log(`   Product: ${product.id}`);

        // Create monthly price
        const monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.monthlyPrice,
            currency: "usd",
            recurring: { interval: "month" },
            metadata: { plan: plan.name.toLowerCase(), interval: "monthly" },
        });
        console.log(`   Monthly: ${monthlyPrice.id} ($${(plan.monthlyPrice / 100).toFixed(2)}/mo)`);

        // Create yearly price
        const yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.yearlyPrice,
            currency: "usd",
            recurring: { interval: "year" },
            metadata: { plan: plan.name.toLowerCase(), interval: "yearly" },
        });
        console.log(`   Yearly:  ${yearlyPrice.id} ($${(plan.yearlyPrice / 100).toFixed(2)}/yr)\n`);

        results.push({
            plan: plan.name.toLowerCase(),
            productId: product.id,
            monthlyPriceId: monthlyPrice.id,
            yearlyPriceId: yearlyPrice.id,
            monthlyAmount: plan.monthlyPrice,
            yearlyAmount: plan.yearlyPrice,
        });
    }

    // Output config for stripe-config.js
    console.log("═══════════════════════════════════════════");
    console.log("  UPDATE lib/stripe-config.js WITH:");
    console.log("═══════════════════════════════════════════\n");

    console.log("export const PLANS = {");
    for (const r of results) {
        console.log(`    ${r.plan}: {`);
        console.log(`        monthly: { priceId: "${r.monthlyPriceId}", amount: ${r.monthlyAmount} },`);
        console.log(`        yearly:  { priceId: "${r.yearlyPriceId}", amount: ${r.yearlyAmount} },`);
        console.log(`    },`);
    }
    console.log("};");

    console.log("\n═══════════════════════════════════════════");
    console.log("  WEBHOOK SETUP");
    console.log("═══════════════════════════════════════════\n");
    console.log("  Go to: https://dashboard.stripe.com/webhooks");
    console.log("  Create endpoint:");
    console.log("    URL:    https://tryhustleai.com/api/stripe/webhook");
    console.log("    Events:");
    console.log("      - checkout.session.completed");
    console.log("      - invoice.paid");
    console.log("      - invoice.payment_failed");
    console.log("      - customer.subscription.created");
    console.log("      - customer.subscription.updated");
    console.log("      - customer.subscription.deleted");
    console.log("\n  Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET\n");
}

main().catch(err => {
    console.error("Setup failed:", err);
    process.exit(1);
});
