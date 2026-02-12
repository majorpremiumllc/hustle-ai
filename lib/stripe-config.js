/**
 * HustleAI — Stripe Configuration
 * Centralized Stripe config with plan/price mapping.
 */

// Plan IDs mapped to Stripe Price IDs
// These will be created automatically via /api/stripe/setup
export const PLAN_CONFIG = {
    starter: {
        name: "Starter",
        monthly: { amount: 1999, interval: "month" },
        yearly: { amount: 19104, interval: "year" }, // $15.92/mo × 12
    },
    professional: {
        name: "Professional",
        monthly: { amount: 2999, interval: "month" },
        yearly: { amount: 28800, interval: "year" }, // $24/mo × 12
    },
    business: {
        name: "Business",
        monthly: { amount: 4999, interval: "month" },
        yearly: { amount: 48000, interval: "year" }, // $40/mo × 12
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
