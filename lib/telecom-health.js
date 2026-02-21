/**
 * HustleAI — Telecom Health Monitor
 * Tracks per-client messaging health: delivery rates, error codes,
 * opt-out rates, message volume, and spam risk.
 * 
 * Alerts if:
 * - Delivery < 85%
 * - Opt-out > 5%
 * - Error spike detected
 */

import prisma from "@/lib/prisma";

/**
 * Record a message delivery event (called from Twilio status callback).
 */
export async function recordDeliveryEvent(companyId, status, errorCode = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert daily health record
    const existing = await prisma.telecomHealth.findFirst({
        where: { companyId, period: "daily", periodStart: today },
    });

    if (existing) {
        const data = { messagesSent: existing.messagesSent + 1 };

        if (status === "delivered") {
            data.messagesDelivered = existing.messagesDelivered + 1;
        } else if (status === "failed" || status === "undelivered") {
            data.messagesFailed = existing.messagesFailed + 1;
        } else if (status === "blocked") {
            data.messagesBlocked = existing.messagesBlocked + 1;
        }

        // Track error codes
        if (errorCode) {
            const codes = existing.errorCodes ? JSON.parse(existing.errorCodes) : {};
            codes[errorCode] = (codes[errorCode] || 0) + 1;
            data.errorCodes = JSON.stringify(codes);
        }

        // Recalculate delivery rate
        const totalSent = data.messagesSent || existing.messagesSent;
        const totalDelivered = data.messagesDelivered || existing.messagesDelivered;
        data.deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100 * 10) / 10 : 100;

        await prisma.telecomHealth.update({
            where: { id: existing.id },
            data,
        });
    } else {
        await prisma.telecomHealth.create({
            data: {
                companyId,
                period: "daily",
                periodStart: today,
                messagesSent: 1,
                messagesDelivered: status === "delivered" ? 1 : 0,
                messagesFailed: (status === "failed" || status === "undelivered") ? 1 : 0,
                messagesBlocked: status === "blocked" ? 1 : 0,
                deliveryRate: status === "delivered" ? 100 : 0,
                errorCodes: errorCode ? JSON.stringify({ [errorCode]: 1 }) : null,
            },
        });
    }
}

/**
 * Record opt-in/opt-out event.
 */
export async function recordConsentEvent(companyId, type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.telecomHealth.findFirst({
        where: { companyId, period: "daily", periodStart: today },
    });

    if (existing) {
        const data = type === "opt-out"
            ? { optOuts: existing.optOuts + 1 }
            : { optIns: existing.optIns + 1 };

        // Recalculate opt-out rate
        const totalOptOuts = data.optOuts || existing.optOuts;
        const totalMessages = existing.messagesSent || 1;
        data.optOutRate = Math.round((totalOptOuts / totalMessages) * 100 * 10) / 10;

        await prisma.telecomHealth.update({ where: { id: existing.id }, data });
    } else {
        await prisma.telecomHealth.create({
            data: {
                companyId,
                period: "daily",
                periodStart: today,
                optOuts: type === "opt-out" ? 1 : 0,
                optIns: type === "opt-in" ? 1 : 0,
                optOutRate: type === "opt-out" ? 100 : 0,
            },
        });
    }
}

/**
 * Calculate spam risk score (0-100) for a client.
 * Higher = more risk.
 */
export async function calculateSpamRisk(companyId) {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const records = await prisma.telecomHealth.findMany({
        where: { companyId, period: "daily", periodStart: { gte: last7Days } },
        orderBy: { periodStart: "desc" },
    });

    if (records.length === 0) return 0;

    let risk = 0;

    // Overall delivery rate
    const totalSent = records.reduce((s, r) => s + r.messagesSent, 0);
    const totalDelivered = records.reduce((s, r) => s + r.messagesDelivered, 0);
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 100;

    if (deliveryRate < 70) risk += 40;
    else if (deliveryRate < 85) risk += 25;
    else if (deliveryRate < 95) risk += 10;

    // Opt-out rate
    const totalOptOuts = records.reduce((s, r) => s + r.optOuts, 0);
    const optOutRate = totalSent > 0 ? (totalOptOuts / totalSent) * 100 : 0;

    if (optOutRate > 10) risk += 30;
    else if (optOutRate > 5) risk += 20;
    else if (optOutRate > 2) risk += 10;

    // Error spike (more than 10 failures in a day)
    const maxFailures = Math.max(...records.map(r => r.messagesFailed));
    if (maxFailures > 20) risk += 20;
    else if (maxFailures > 10) risk += 10;

    // Blocked messages
    const totalBlocked = records.reduce((s, r) => s + r.messagesBlocked, 0);
    if (totalBlocked > 5) risk += 15;
    else if (totalBlocked > 0) risk += 5;

    return Math.min(100, risk);
}

/**
 * Get telecom health dashboard for a specific client.
 */
export async function getClientTelecomHealth(companyId) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const records = await prisma.telecomHealth.findMany({
        where: { companyId, period: "daily", periodStart: { gte: last30Days } },
        orderBy: { periodStart: "desc" },
    });

    const totalSent = records.reduce((s, r) => s + r.messagesSent, 0);
    const totalDelivered = records.reduce((s, r) => s + r.messagesDelivered, 0);
    const totalFailed = records.reduce((s, r) => s + r.messagesFailed, 0);
    const totalBlocked = records.reduce((s, r) => s + r.messagesBlocked, 0);
    const totalOptOuts = records.reduce((s, r) => s + r.optOuts, 0);
    const totalOptIns = records.reduce((s, r) => s + r.optIns, 0);

    // Aggregate error codes
    const allErrors = {};
    for (const r of records) {
        if (r.errorCodes) {
            try {
                const codes = JSON.parse(r.errorCodes);
                for (const [code, count] of Object.entries(codes)) {
                    allErrors[code] = (allErrors[code] || 0) + count;
                }
            } catch { /* skip */ }
        }
    }

    const spamRisk = await calculateSpamRisk(companyId);

    // Generate alerts
    const alerts = [];
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 100;
    const optOutRate = totalSent > 0 ? (totalOptOuts / totalSent) * 100 : 0;

    if (deliveryRate < 85) {
        alerts.push({ level: "critical", message: `Delivery rate at ${deliveryRate.toFixed(1)}% — below 85% threshold` });
    }
    if (optOutRate > 5) {
        alerts.push({ level: "warning", message: `Opt-out rate at ${optOutRate.toFixed(1)}% — above 5% threshold` });
    }
    if (totalFailed > 10) {
        alerts.push({ level: "warning", message: `${totalFailed} failed messages in last 30 days` });
    }
    if (spamRisk > 50) {
        alerts.push({ level: "critical", message: `Spam risk score is ${spamRisk}/100 — take action` });
    }

    return {
        summary: {
            messagesSent: totalSent,
            messagesDelivered: totalDelivered,
            messagesFailed: totalFailed,
            messagesBlocked: totalBlocked,
            deliveryRate: Math.round(deliveryRate * 10) / 10,
            optOuts: totalOptOuts,
            optIns: totalOptIns,
            optOutRate: Math.round(optOutRate * 10) / 10,
            spamRiskScore: spamRisk,
        },
        errorCodes: allErrors,
        alerts,
        daily: records.map(r => ({
            date: r.periodStart.toISOString().split("T")[0],
            sent: r.messagesSent,
            delivered: r.messagesDelivered,
            failed: r.messagesFailed,
            deliveryRate: r.deliveryRate,
        })),
    };
}

/**
 * Get telecom health for ALL clients (Command Center view).
 */
export async function getAllClientsHealth() {
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, phone: true, industry: true },
    });

    const results = [];
    for (const company of companies) {
        const health = await getClientTelecomHealth(company.id);
        results.push({
            id: company.id,
            name: company.name,
            phone: company.phone,
            industry: company.industry,
            ...health.summary,
            alertCount: health.alerts.length,
            alerts: health.alerts,
        });
    }

    // Sort by spam risk (highest first)
    results.sort((a, b) => b.spamRiskScore - a.spamRiskScore);

    return results;
}
