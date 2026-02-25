/**
 * HustleAI — Lead Webhook API
 * Receives inbound lead notifications from:
 * 1. Email forwarding services (Resend Inbound, SendGrid, Mailgun)
 * 2. Direct webhook integrations
 * 3. Zapier/Make automations
 *
 * Triggers the Lead Responder agent for instant multi-channel response.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST — Receive a new lead via webhook
 * Accepts both raw email-parsed data and structured lead data.
 */
export async function POST(request) {
    try {
        const body = await request.json();

        // Validate API key if set
        const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
        const expectedKey = process.env.LEAD_WEBHOOK_SECRET;
        if (expectedKey && apiKey !== expectedKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Determine data format
        let leadData;

        if (body.from && body.subject) {
            // Email-forwarded format (from Resend Inbound / SendGrid / Mailgun)
            leadData = parseEmailWebhook(body);
        } else if (body.customerName || body.customer_name) {
            // Direct structured format
            leadData = {
                customerName: body.customerName || body.customer_name || "Unknown",
                customerPhone: body.customerPhone || body.customer_phone || body.phone || "",
                customerEmail: body.customerEmail || body.customer_email || body.email || null,
                jobType: body.jobType || body.job_type || body.service || "General",
                description: body.description || body.message || body.notes || "",
                source: body.source || body.platform || "Webhook",
                replyToEmail: body.replyToEmail || body.reply_to || null,
                urgency: body.urgency || "Flexible",
            };
        } else {
            return NextResponse.json({
                error: "Invalid payload format",
                expected: {
                    structured: { customerName: "John", customerPhone: "+17025551234", jobType: "Handyman", source: "Thumbtack" },
                    email: { from: "noreply@thumbtack.com", subject: "New lead...", html: "..." },
                },
            }, { status: 400 });
        }

        // Get company (single-tenant for now)
        const company = await prisma.company.findFirst();
        if (!company) {
            return NextResponse.json({ error: "No company configured" }, { status: 500 });
        }

        // Check for duplicate (same phone within last hour)
        if (leadData.customerPhone) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const existing = await prisma.lead.findFirst({
                where: {
                    companyId: company.id,
                    customerPhone: leadData.customerPhone,
                    createdAt: { gte: oneHourAgo },
                },
            });

            if (existing) {
                return NextResponse.json({
                    status: "duplicate",
                    message: "Lead with this phone already received within the last hour",
                    leadId: existing.id,
                });
            }
        }

        // Create lead in DB
        const lead = await prisma.lead.create({
            data: {
                companyId: company.id,
                customerName: leadData.customerName,
                customerPhone: leadData.customerPhone,
                customerEmail: leadData.customerEmail,
                jobType: leadData.jobType,
                notes: leadData.description,
                source: leadData.source,
                status: "new",
                urgency: leadData.urgency,
            },
        });

        // Update leadsUsed count
        await prisma.subscription.updateMany({
            where: { companyId: company.id },
            data: { leadsUsed: { increment: 1 } },
        });

        console.log(`[Webhook] ✅ Lead created: ${lead.id} from ${leadData.source}`);

        // Trigger Lead Responder agent (async - don't block webhook response)
        triggerResponder(company.id, leadData).catch((err) => {
            console.error("[Webhook] ❌ Responder error:", err.message);
        });

        return NextResponse.json({
            status: "success",
            leadId: lead.id,
            message: `Lead received and AI auto-response triggered`,
            channels: {
                sms: !!leadData.customerPhone,
                call: !!leadData.customerPhone,
                platform_reply: !!leadData.replyToEmail,
            },
        });

    } catch (err) {
        console.error("[Webhook] ❌ Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * Parse email-forwarded webhook payload.
 */
function parseEmailWebhook(body) {
    const from = (body.from || "").toLowerCase();
    const subject = body.subject || "";
    const html = body.html || "";
    const text = body.text || "";
    const replyTo = body.reply_to || body.replyTo || "";

    let platform = "Webhook";
    if (from.includes("thumbtack")) platform = "Thumbtack";
    else if (from.includes("yelp")) platform = "Yelp";

    // Extract name from subject
    let customerName = null;
    const nameMatch = subject.match(/(?:from|new lead|request)[:\s]*(.+?)(?:\s+needs?|\s+-|\s*$)/i);
    if (nameMatch) customerName = nameMatch[1].trim();

    // Extract phone from body
    let customerPhone = null;
    const content = html || text;
    const phoneMatch = content.match(/(?:\+?1?\s*)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) {
        customerPhone = phoneMatch[0].replace(/[^\d+]/g, "");
        if (customerPhone.length === 10) customerPhone = "+1" + customerPhone;
    }

    // Extract job type
    let jobType = "General";
    const jobMatch = subject.match(/needs?\s+(.+?)(?:\s*$)/i) || content.match(/(?:project|service|looking for)[:\s]+(.+?)(?:<|\.|$)/im);
    if (jobMatch) jobType = jobMatch[1].replace(/<[^>]+>/g, "").trim();

    return {
        customerName: customerName || "Unknown",
        customerPhone: customerPhone || "",
        customerEmail: null,
        jobType,
        description: text?.slice(0, 500) || "",
        source: platform,
        replyToEmail: replyTo,
        urgency: "Flexible",
    };
}

/**
 * Trigger the Lead Responder agent (non-blocking).
 */
async function triggerResponder(companyId, leadData) {
    const { respondToLead } = require("@/lib/agents/lead-responder");
    return respondToLead(companyId, leadData);
}

/**
 * GET — Health check / info
 */
export async function GET() {
    return NextResponse.json({
        endpoint: "/api/leads/webhook",
        methods: ["POST"],
        description: "Receives inbound leads from Yelp, Thumbtack, or any webhook source. Triggers AI auto-response via SMS + call + platform reply.",
        required_fields: ["customerName", "customerPhone", "source"],
        optional_fields: ["jobType", "description", "replyToEmail", "urgency"],
        example: {
            customerName: "John D.",
            customerPhone: "+17025551234",
            jobType: "Handyman",
            source: "Thumbtack",
            description: "Need help mounting 3 TVs",
        },
    });
}
