/**
 * HustleAI — Twilio Status Callback Webhook (Hardened)
 * Handles BOTH call status and SMS delivery status callbacks.
 * Phase 1: Twilio signature validation
 * Phase 4: SMS delivery tracking → TelecomHealth
 * Triggers missed-call text-back when a call goes unanswered.
 */

import prisma from "@/lib/prisma";
import { validateTwilioWebhook, twilioErrorResponse } from "@/lib/twilio-auth";
import { recordDeliveryEvent, recordConsentEvent } from "@/lib/telecom-health";

export async function POST(request) {
    // ── Signature Validation ──
    const validation = await validateTwilioWebhook(request);
    if (!validation.valid) {
        return twilioErrorResponse();
    }

    const { params } = validation;

    // Determine if this is a call status or message status callback
    const messageSid = params.MessageSid || params.SmsSid;
    const callSid = params.CallSid;

    if (messageSid && !callSid) {
        // ── SMS Delivery Status Callback (Phase 4) ──
        return handleMessageStatus(params);
    }

    if (callSid) {
        // ── Call Status Callback ──
        return handleCallStatus(params);
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}

/* ── SMS Delivery Status Handler (Phase 4) ───── */
async function handleMessageStatus(params) {
    const messageSid = params.MessageSid || params.SmsSid || "";
    const status = params.MessageStatus || params.SmsStatus || "";
    const errorCode = params.ErrorCode || null;
    const to = params.To || "";
    const from = params.From || "";

    console.log(`[Status] Message ${messageSid}: ${status}${errorCode ? ` (error: ${errorCode})` : ""}`);

    // Find company by sender number (our number is the From on outbound)
    const phoneRecord = await prisma.phoneNumber.findFirst({
        where: { number: from },
    });

    if (phoneRecord) {
        // Record delivery event in TelecomHealth
        await recordDeliveryEvent(phoneRecord.companyId, status, errorCode);
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}

/* ── Call Status Handler ─────────────────────── */
async function handleCallStatus(params) {
    const callSid = params.CallSid || "";
    const callStatus = params.CallStatus || "";
    const from = params.From || "";
    const to = params.To || params.Called || "";
    const duration = parseInt(params.CallDuration || "0", 10);

    console.log(`[Status] Call ${callSid}: ${callStatus} (${from} → ${to}, ${duration}s)`);

    // Update call log in database
    const callLog = await prisma.callLog.findFirst({ where: { callSid } });
    if (callLog) {
        await prisma.callLog.update({
            where: { id: callLog.id },
            data: {
                status: callStatus,
                duration: duration || callLog.duration,
            },
        });
    }

    // ── Missed Call Text-Back ────────────────────
    const missedStatuses = ["no-answer", "busy", "canceled"];

    if (missedStatuses.includes(callStatus) && from && to) {
        try {
            const phoneRecord = await prisma.phoneNumber.findFirst({
                where: { number: to },
                include: { company: true },
            });

            if (!phoneRecord?.company) {
                const company = await prisma.company.findFirst();
                if (company) {
                    await sendMissedCallText(company, from, to);
                }
            } else {
                await sendMissedCallText(phoneRecord.company, from, to);
            }
        } catch (err) {
            console.error("[Status] Missed-call text-back error:", err.message);
        }
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}

/**
 * Send a missed-call text-back SMS.
 */
async function sendMissedCallText(company, callerPhone, companyPhone) {
    if (!company.missedCallTextBack) {
        console.log(`[Status] Missed-call text-back disabled for ${company.name}`);
        return;
    }

    const message = company.missedCallMessage ||
        `Hi! Sorry we missed your call. This is ${company.name}. How can we help you today? Reply to this text or call us back anytime! 😊`;

    // Use subaccount if available
    const sid = company.twilioSubAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const token = company.twilioSubAuthToken || process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
        console.error("[Status] No Twilio credentials for missed-call text-back");
        return;
    }

    const twilio = require("twilio")(sid, token);
    const result = await twilio.messages.create({
        from: companyPhone,
        to: callerPhone,
        body: message,
    });

    console.log(`[Status] ✅ Missed-call text-back sent to ${callerPhone} (${result.sid})`);

    // Log as inbound lead
    const existingLead = await prisma.lead.findFirst({
        where: { companyId: company.id, customerPhone: callerPhone },
    });

    if (!existingLead) {
        await prisma.lead.create({
            data: {
                companyId: company.id,
                customerName: callerPhone,
                customerPhone: callerPhone,
                source: "Missed Call",
                jobType: "General",
                status: "new",
                notes: "Auto text-back sent after missed call",
            },
        });
        console.log(`[Status] 📋 New lead created from missed call: ${callerPhone}`);
    }
}
