// ─────────────────────────────────────────────
// Lead Capture & Notification Service
// ─────────────────────────────────────────────

const twilio = require('twilio');
const { appendLead } = require('./sheets');
const { COMPANY, LEAD_STATUSES } = require('../config/constants');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Process and store a captured lead.
 * - Save to Google Sheets
 * - Fire Make.com webhook
 * - Send SMS notification to owner
 *
 * @param {Object} leadData
 * @returns {Object} Result with success status
 */
async function handleLeadCapture(leadData) {
    const lead = {
        timestamp: new Date().toISOString(),
        status: LEAD_STATUSES.NEW,
        ...leadData,
    };

    console.log(`[Lead] Captured: ${lead.customer_name} | ${lead.job_type} | ${lead.address}`);

    // 1. Save to Google Sheets
    const sheetSaved = await appendLead(lead);

    // 2. Fire Make.com webhook
    const webhookFired = await fireMakeWebhook(lead);

    // 3. Notify owner via SMS
    const ownerNotified = await notifyOwner(lead);

    return {
        success: true,
        lead_captured: true,
        sheet_saved: sheetSaved,
        webhook_fired: webhookFired,
        owner_notified: ownerNotified,
        message: `Lead for ${lead.customer_name} has been recorded. The team will follow up.`,
    };
}

/**
 * Send an SMS summary to the business owner.
 */
async function notifyOwner(lead) {
    try {
        const message = [
            `📋 NEW LEAD — ${COMPANY.name}`,
            `Name: ${lead.customer_name}`,
            `Phone: ${lead.phone_number}`,
            `Job: ${lead.job_type}`,
            `Address: ${lead.address}`,
            `Urgency: ${lead.urgency}`,
            lead.preferred_date ? `Date: ${lead.preferred_date}` : '',
            lead.notes ? `Notes: ${lead.notes}` : '',
            `Photos: ${lead.has_photos ? 'Yes' : 'No'}`,
            `Source: ${lead.source || 'Unknown'}`,
            `Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`,
        ]
            .filter(Boolean)
            .join('\n');

        await client.messages.create({
            body: message,
            from: COMPANY.phone,
            to: COMPANY.ownerPhone,
        });

        console.log(`[Lead] Owner notified at ${COMPANY.ownerPhone}`);
        return true;
    } catch (err) {
        console.error('[Lead] Failed to notify owner:', err.message);
        return false;
    }
}

/**
 * Fire a webhook to Make.com / Zapier for further automation.
 */
async function fireMakeWebhook(lead) {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('[Lead] MAKE_WEBHOOK_URL not configured, skipping webhook.');
        return false;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead),
        });

        if (response.ok) {
            console.log('[Lead] Make.com webhook fired successfully.');
            return true;
        } else {
            console.error(`[Lead] Make.com webhook returned ${response.status}`);
            return false;
        }
    } catch (err) {
        console.error('[Lead] Make.com webhook error:', err.message);
        return false;
    }
}

module.exports = { handleLeadCapture };
