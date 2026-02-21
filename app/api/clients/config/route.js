/**
 * HustleAI — Client Config API
 * Dynamic configuration endpoint for client AI behavior.
 * AI loads config per incoming message — no global settings.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getComplianceScore } from "@/lib/compliance";
import { requireAdmin } from "@/lib/admin-auth";

// ── GET: Get client config ─────────────────────
export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
        where: { id: clientId },
        include: { phoneNumbers: true },
    });

    if (!company) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse JSON fields
    let services = [];
    try { services = JSON.parse(company.aiServices || "[]"); } catch { /* */ }

    let businessHours = null;
    try { businessHours = JSON.parse(company.businessHours || "null"); } catch { /* */ }

    // Get compliance score
    const compliance = await getComplianceScore(clientId);

    return NextResponse.json({
        config: {
            id: company.id,
            businessName: company.name,
            industry: company.industry,
            phone: company.phone,
            email: company.email,
            address: company.address,
            serviceArea: company.serviceArea,
            phoneNumbers: company.phoneNumbers.map(p => p.number),
            // AI Config
            aiTone: company.aiTone,
            aiGreeting: company.aiGreeting,
            aiPricingMsg: company.aiPricingMsg,
            aiEscalationMsg: company.aiEscalationMsg,
            services,
            // Operational Config
            businessHours,
            emergencyNumber: company.emergencyNumber,
            language: company.language,
            leadRoutingMode: company.leadRoutingMode,
            afterHoursMessage: company.afterHoursMessage,
            maxSmsPerDay: company.maxSmsPerDay,
            missedCallTextBack: company.missedCallTextBack,
            missedCallMessage: company.missedCallMessage,
            // Compliance
            complianceScore: compliance.score,
            complianceDetails: compliance.details,
        },
    });
}

// ── PUT: Update client config ──────────────────
export async function PUT(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { clientId, ...updates } = body;

    if (!clientId) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    // Map config fields to DB columns
    const data = {};

    if (updates.businessName) data.name = updates.businessName;
    if (updates.industry) data.industry = updates.industry;
    if (updates.phone) data.phone = updates.phone;
    if (updates.email) data.email = updates.email;
    if (updates.address) data.address = updates.address;
    if (updates.serviceArea) data.serviceArea = updates.serviceArea;
    if (updates.aiTone) data.aiTone = updates.aiTone;
    if (updates.aiGreeting) data.aiGreeting = updates.aiGreeting;
    if (updates.aiPricingMsg) data.aiPricingMsg = updates.aiPricingMsg;
    if (updates.aiEscalationMsg) data.aiEscalationMsg = updates.aiEscalationMsg;
    if (updates.emergencyNumber) data.emergencyNumber = updates.emergencyNumber;
    if (updates.afterHoursMessage) data.afterHoursMessage = updates.afterHoursMessage;
    if (updates.missedCallMessage) data.missedCallMessage = updates.missedCallMessage;
    if (updates.language) data.language = updates.language;
    if (updates.leadRoutingMode) data.leadRoutingMode = updates.leadRoutingMode;

    if (updates.services) data.aiServices = JSON.stringify(updates.services);
    if (updates.businessHours) data.businessHours = JSON.stringify(updates.businessHours);
    if (typeof updates.maxSmsPerDay === "number") data.maxSmsPerDay = updates.maxSmsPerDay;
    if (typeof updates.missedCallTextBack === "boolean") data.missedCallTextBack = updates.missedCallTextBack;

    const updated = await prisma.company.update({
        where: { id: clientId },
        data,
    });

    console.log(`[Config] Updated config for ${updated.name} (${clientId})`);
    return NextResponse.json({ success: true, config: { id: updated.id, name: updated.name } });
}
