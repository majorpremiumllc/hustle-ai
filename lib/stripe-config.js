/**
 * HustleAI — Stripe Configuration
 * Centralized Stripe config with plan/price mapping.
 */

// Plan IDs mapped to Stripe Price IDs
// These will be created automatically via /api/stripe/setup
export const PLAN_CONFIG = {
    starter: {
        name: "Starter",
        monthly: { amount: 4900, interval: "month" },
        yearly: { amount: 47040, interval: "year" }, // $39.20/mo × 12
    },
    professional: {
        name: "Professional",
        monthly: { amount: 9900, interval: "month" },
        yearly: { amount: 94800, interval: "year" }, // $79/mo × 12
    },
    business: {
        name: "Business",
        monthly: { amount: 19900, interval: "month" },
        yearly: { amount: 190800, interval: "year" }, // $159/mo × 12
    },
};

// Map plan names to internal IDs
export function getPlanId(planName) {
    const map = {
        Starter: "starter",
        Professional: "professional",
        Business: "business",
    };
    return map[planName] || "starter";
}
