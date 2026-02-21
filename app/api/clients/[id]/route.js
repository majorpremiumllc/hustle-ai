/**
 * HustleAI — Client Management API (Hardened)
 * View and update individual client configuration.
 * All endpoints require admin authentication.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { decryptTwilioCredentials } from "@/lib/encryption";

// ── GET: Get client details ────────────────────
export async function GET(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id } = await params;

    const client = await prisma.company.findUnique({
        where: { id },
        include: {
            phoneNumbers: true,
            subscription: true,
            leads: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
            conversations: {
                orderBy: { updatedAt: "desc" },
                take: 10,
                include: {
                    messages: { orderBy: { createdAt: "desc" }, take: 5 },
                },
            },
            callLogs: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: {
                    leads: true,
                    conversations: true,
                    callLogs: true,
                },
            },
        },
    });

    if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
}

// ── PATCH: Update client config ────────────────
export async function PATCH(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Allowed update fields
    const allowedFields = [
        "name", "phone", "email", "address", "serviceArea", "industry",
        "aiGreeting", "aiTone", "aiServices", "aiEscalationMsg", "aiPricingMsg",
        "missedCallTextBack", "missedCallMessage",
    ];

    const data = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            data[field] = body[field];
        }
    }

    // Handle services as JSON
    if (body.services && Array.isArray(body.services)) {
        data.aiServices = JSON.stringify(body.services);
    }

    const updated = await prisma.company.update({
        where: { id },
        data,
    });

    console.log(`[Clients] Updated ${updated.name} (${id})`);
    return NextResponse.json({ success: true, client: updated });
}

// ── DELETE: Remove a client ────────────────────
export async function DELETE(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id } = await params;

    const client = await prisma.company.findUnique({
        where: { id },
        include: { phoneNumbers: true },
    });

    if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Release Twilio numbers (decrypt auth token for API call)
    const creds = decryptTwilioCredentials(client);
    for (const phone of client.phoneNumbers) {
        if (phone.twilioSid) {
            try {
                const sid = creds.sid || process.env.TWILIO_ACCOUNT_SID;
                const token = creds.authToken || process.env.TWILIO_AUTH_TOKEN;
                const twilio = require("twilio")(sid, token);
                await twilio.incomingPhoneNumbers(phone.twilioSid).remove();
                console.log(`[Clients] Released number ${phone.number}`);
            } catch (err) {
                console.error(`[Clients] Failed to release ${phone.number}: ${err.message}`);
            }
        }
    }

    // Suspend subaccount (don't delete — Twilio doesn't allow deletion)
    if (client.twilioSubAccountSid) {
        try {
            const master = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await master.api.accounts(client.twilioSubAccountSid).update({ status: "suspended" });
            console.log(`[Clients] Suspended subaccount ${client.twilioSubAccountSid}`);
        } catch (err) {
            console.error(`[Clients] Failed to suspend subaccount: ${err.message}`);
        }
    }

    // Delete from database (cascade handled by Prisma)
    await prisma.company.delete({ where: { id } });
    console.log(`[Clients] Deleted client ${client.name} (${id})`);

    return NextResponse.json({ success: true });
}
