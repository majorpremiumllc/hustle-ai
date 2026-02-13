/**
 * HustleAI — Plan Limits & Enforcement
 * Central config mapping plan → limits.
 * Used by API routes to enforce subscription boundaries.
 */

import prisma from "@/lib/prisma";

// ── Plan Feature Matrix ────────────────────────
export const PLAN_LIMITS = {
    starter: {
        name: "Starter",
        leadsPerMonth: 100,
        phoneNumbers: 1,
        integrationSources: 2,
        teamMembers: 1, // owner only
        features: {
            sms: true,
            voiceAutoResponder: true,
            voiceCalls: false,
            leadDashboard: true,
            basicAnalytics: true,
            advancedAnalytics: false,
            customScripts: false,
            customTone: false,
            crmExport: false,
            apiAccess: false,
            zapier: false,
            voiceCloning: false,
            whiteLabel: false,
            dedicatedSupport: false,
            customReports: false,
        },
    },
    professional: {
        name: "Professional",
        leadsPerMonth: 500,
        phoneNumbers: 2,
        integrationSources: 999, // all
        teamMembers: 5,
        features: {
            sms: true,
            voiceAutoResponder: true,
            voiceCalls: true,
            leadDashboard: true,
            basicAnalytics: true,
            advancedAnalytics: true,
            customScripts: true,
            customTone: true,
            crmExport: true,
            apiAccess: false,
            zapier: true,
            voiceCloning: false,
            whiteLabel: false,
            dedicatedSupport: false,
            customReports: false,
        },
    },
    business: {
        name: "Business",
        leadsPerMonth: Infinity,
        phoneNumbers: 5,
        integrationSources: 999,
        teamMembers: Infinity,
        features: {
            sms: true,
            voiceAutoResponder: true,
            voiceCalls: true,
            leadDashboard: true,
            basicAnalytics: true,
            advancedAnalytics: true,
            customScripts: true,
            customTone: true,
            crmExport: true,
            apiAccess: true,
            zapier: true,
            voiceCloning: true,
            whiteLabel: true,
            dedicatedSupport: true,
            customReports: true,
        },
    },
};

/**
 * Get the limits config for a plan.
 * @param {string} plan - "starter" | "professional" | "business"
 */
export function getPlanLimits(plan) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

/**
 * Check if a company can use a specific resource.
 * Returns { allowed, used, limit, plan }
 *
 * @param {string} companyId
 * @param {"leads"|"phoneNumbers"|"teamMembers"|"integrations"} resource
 */
export async function checkLimit(companyId, resource) {
    const subscription = await prisma.subscription.findUnique({
        where: { companyId },
    });

    if (!subscription) {
        return { allowed: false, used: 0, limit: 0, plan: null, reason: "No subscription found" };
    }

    const limits = getPlanLimits(subscription.plan);
    let used = 0;
    let limit = 0;

    switch (resource) {
        case "leads": {
            // Count leads created in current billing period
            used = await prisma.lead.count({
                where: {
                    companyId,
                    createdAt: { gte: subscription.currentPeriodStart },
                },
            });
            limit = limits.leadsPerMonth;
            break;
        }
        case "phoneNumbers": {
            used = await prisma.phoneNumber.count({ where: { companyId } });
            limit = limits.phoneNumbers;
            break;
        }
        case "teamMembers": {
            used = await prisma.user.count({ where: { companyId } });
            limit = limits.teamMembers;
            break;
        }
        case "integrations": {
            used = await prisma.integration.count({ where: { companyId, enabled: true } });
            limit = limits.integrationSources;
            break;
        }
        default:
            return { allowed: false, used: 0, limit: 0, plan: subscription.plan, reason: `Unknown resource: ${resource}` };
    }

    const allowed = limit === Infinity || used < limit;
    return {
        allowed,
        used,
        limit: limit === Infinity ? "unlimited" : limit,
        plan: subscription.plan,
        reason: allowed ? null : `${resource} limit reached (${used}/${limit}) on ${limits.name} plan. Upgrade to continue.`,
    };
}

/**
 * Check if a feature is available on the company's plan.
 * @param {string} companyId
 * @param {string} featureName - key from features object
 */
export async function checkFeature(companyId, featureName) {
    const subscription = await prisma.subscription.findUnique({
        where: { companyId },
    });

    if (!subscription) {
        return { allowed: false, plan: null, reason: "No subscription found" };
    }

    const limits = getPlanLimits(subscription.plan);
    const allowed = limits.features[featureName] === true;

    return {
        allowed,
        plan: subscription.plan,
        reason: allowed ? null : `${featureName} is not available on the ${limits.name} plan. Upgrade to unlock this feature.`,
    };
}

/**
 * Look up which company owns a phone number.
 * Used by Twilio webhooks to route calls/SMS to the right tenant.
 * @param {string} phoneNumber - E.164 format
 */
export async function getCompanyByPhone(phoneNumber) {
    const record = await prisma.phoneNumber.findUnique({
        where: { number: phoneNumber },
        include: {
            company: {
                include: { subscription: true },
            },
        },
    });

    return record?.company || null;
}
