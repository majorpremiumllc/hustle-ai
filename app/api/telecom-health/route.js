/**
 * HustleAI — Telecom Health Dashboard API
 * Per-client and all-clients telecom health monitoring.
 */

import { NextResponse } from "next/server";
import { getClientTelecomHealth, getAllClientsHealth } from "@/lib/telecom-health";
import { getComplianceScore } from "@/lib/compliance";
import { requireAdmin } from "@/lib/admin-auth";

// ── GET: Telecom health data ────────────────────
export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    try {
        if (clientId) {
            // Per-client health
            const health = await getClientTelecomHealth(clientId);
            const compliance = await getComplianceScore(clientId);

            return NextResponse.json({
                clientId,
                health,
                compliance,
            });
        }

        // All clients overview (Command Center)
        const allHealth = await getAllClientsHealth();

        return NextResponse.json({
            clients: allHealth,
            summary: {
                totalClients: allHealth.length,
                healthyClients: allHealth.filter(c => c.alertCount === 0).length,
                criticalAlerts: allHealth.reduce((s, c) => s + c.alerts.filter(a => a.level === "critical").length, 0),
                warningAlerts: allHealth.reduce((s, c) => s + c.alerts.filter(a => a.level === "warning").length, 0),
                averageDeliveryRate: allHealth.length > 0
                    ? Math.round(allHealth.reduce((s, c) => s + c.deliveryRate, 0) / allHealth.length * 10) / 10
                    : 100,
                averageSpamRisk: allHealth.length > 0
                    ? Math.round(allHealth.reduce((s, c) => s + c.spamRiskScore, 0) / allHealth.length)
                    : 0,
            },
        });
    } catch (err) {
        console.error("[TelecomHealth] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
