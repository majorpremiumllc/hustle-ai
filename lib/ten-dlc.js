/**
 * HustleAI — 10DLC Campaign Readiness Tracking
 * Tracks A2P 10DLC registration status per client.
 * Blocks outbound SMS if campaign not approved.
 * Flags unregistered numbers in dashboard.
 */

import prisma from "@/lib/prisma";

// ── 10DLC Campaign Statuses ─────────────────────
// Twilio A2P Campaign registration statuses
const CAMPAIGN_STATUSES = {
    NOT_REGISTERED: "not-registered",
    PENDING: "pending",
    IN_REVIEW: "in-review",
    APPROVED: "approved",
    REJECTED: "rejected",
    SUSPENDED: "suspended",
};

/**
 * Check if a client's number is 10DLC-approved for outbound messaging.
 * Blocks outbound SMS if campaign not approved.
 * 
 * @param {string} companyId - Company ID
 * @returns {Promise<{ approved: boolean, status: string, message?: string }>}
 */
export async function check10DLCStatus(companyId) {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { phoneNumbers: true },
    });

    if (!company) {
        return { approved: false, status: "unknown", message: "Company not found" };
    }

    // Check each phone number for 10DLC registration status
    const numbers = company.phoneNumbers || [];
    const unregistered = numbers.filter(n => !n.campaignStatus || n.campaignStatus === CAMPAIGN_STATUSES.NOT_REGISTERED);
    const pending = numbers.filter(n => n.campaignStatus === CAMPAIGN_STATUSES.PENDING || n.campaignStatus === CAMPAIGN_STATUSES.IN_REVIEW);
    const approved = numbers.filter(n => n.campaignStatus === CAMPAIGN_STATUSES.APPROVED);
    const rejected = numbers.filter(n => n.campaignStatus === CAMPAIGN_STATUSES.REJECTED);

    if (numbers.length === 0) {
        return { approved: false, status: "no-numbers", message: "No phone numbers provisioned" };
    }

    if (approved.length > 0) {
        return { approved: true, status: "approved", approvedNumbers: approved.map(n => n.number) };
    }

    if (pending.length > 0) {
        return {
            approved: false,
            status: "pending",
            message: `${pending.length} number(s) pending 10DLC approval. Outbound SMS blocked until approved.`,
            pendingNumbers: pending.map(n => n.number),
        };
    }

    if (rejected.length > 0) {
        return {
            approved: false,
            status: "rejected",
            message: `10DLC campaign rejected. Contact support to resolve.`,
            rejectedNumbers: rejected.map(n => n.number),
        };
    }

    return {
        approved: false,
        status: "not-registered",
        message: `${unregistered.length} number(s) not registered for 10DLC. Register before sending outbound SMS.`,
        unregisteredNumbers: unregistered.map(n => n.number),
    };
}

/**
 * Get 10DLC dashboard data for all clients.
 * Shows registration status, blockers, and required actions.
 */
export async function get10DLCDashboard() {
    const companies = await prisma.company.findMany({
        include: {
            phoneNumbers: true,
            subscription: { select: { plan: true, status: true } },
        },
    });

    const results = companies.map(company => {
        const numbers = company.phoneNumbers || [];
        const statuses = numbers.map(n => ({
            number: n.number,
            status: n.campaignStatus || CAMPAIGN_STATUSES.NOT_REGISTERED,
            label: n.label,
        }));

        const hasApproved = statuses.some(s => s.status === CAMPAIGN_STATUSES.APPROVED);
        const hasPending = statuses.some(s => s.status === CAMPAIGN_STATUSES.PENDING || s.status === CAMPAIGN_STATUSES.IN_REVIEW);
        const hasUnregistered = statuses.some(s => s.status === CAMPAIGN_STATUSES.NOT_REGISTERED);

        let action = "none";
        if (hasUnregistered) action = "register";
        else if (hasPending) action = "wait";
        else if (hasApproved) action = "ready";

        return {
            id: company.id,
            name: company.name,
            industry: company.industry,
            plan: company.subscription?.plan || "none",
            numbers: statuses,
            ready: hasApproved,
            action,
        };
    });

    return {
        clients: results,
        summary: {
            total: results.length,
            ready: results.filter(r => r.ready).length,
            needsRegistration: results.filter(r => r.action === "register").length,
            pending: results.filter(r => r.action === "wait").length,
        },
    };
}

/**
 * Block outbound SMS if 10DLC not approved.
 * Call this before any outbound SMS send (not inbound webhook replies,
 * as those are exempt from 10DLC for customer-initiated conversations).
 * 
 * @param {string} companyId 
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
export async function canSendOutbound(companyId) {
    const status = await check10DLCStatus(companyId);

    // Allow if approved OR if no phone numbers exist (pre-onboarding)
    if (status.approved || status.status === "no-numbers") {
        return { allowed: true };
    }

    // Block with reason
    return {
        allowed: false,
        reason: status.message || `10DLC status: ${status.status}. Register for A2P messaging before sending outbound SMS.`,
    };
}

export { CAMPAIGN_STATUSES };
