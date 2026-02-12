// ─────────────────────────────────────────────
// Escalation Engine
// ─────────────────────────────────────────────

const twilio = require('twilio');
const { COMPANY } = require('../config/constants');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const ESCALATION_LABELS = {
    high_budget: 'Budget over $2,000',
    full_remodel: 'Full remodel/renovation requested',
    angry_client: 'Client is upset or aggressive',
    owner_request: 'Client asked to speak with owner',
    complex_electrical: 'Complex electrical work',
    complex_plumbing: 'Complex plumbing work',
    other: 'Other',
};

/**
 * Handle an escalation: notify owner via SMS and log.
 *
 * @param {Object} params
 * @param {string} params.reason - Escalation reason key
 * @param {string} params.details - Additional context
 * @param {string} params.customer_phone - Customer's phone number
 * @param {string} params.channel - 'Phone Call' or 'SMS'
 * @param {string} [params.call_sid] - Twilio Call SID (for phone calls)
 * @returns {Object} Escalation result
 */
async function handleEscalation({ reason, details, customer_phone, channel, call_sid }) {
    const label = ESCALATION_LABELS[reason] || reason;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

    console.log(`[ESCALATION] ${label} | ${customer_phone} | ${channel} | ${details}`);

    // Notify owner via SMS
    const ownerMessage = [
        `🚨 ESCALATION — ${COMPANY.name}`,
        `Reason: ${label}`,
        `Customer: ${customer_phone}`,
        `Channel: ${channel}`,
        details ? `Details: ${details}` : '',
        `Time: ${timestamp}`,
        call_sid ? `Call SID: ${call_sid}` : '',
    ]
        .filter(Boolean)
        .join('\n');

    try {
        await client.messages.create({
            body: ownerMessage,
            from: COMPANY.phone,
            to: COMPANY.ownerPhone,
        });
        console.log(`[ESCALATION] Owner notified at ${COMPANY.ownerPhone}`);
    } catch (err) {
        console.error('[ESCALATION] Failed to notify owner:', err.message);
    }

    return {
        success: true,
        escalated: true,
        reason: label,
        message: 'Escalation forwarded to project manager.',
    };
}

/**
 * Check if a message text contains escalation keywords.
 *
 * @param {string} text
 * @returns {string|null} Escalation reason or null
 */
function detectEscalationKeywords(text) {
    const lower = text.toLowerCase();

    if (/full\s*remodel|full\s*renovation|gut(ting)?.*kitchen|gut(ting)?.*bathroom/.test(lower)) {
        return 'full_remodel';
    }
    if (/speak\s*(to|with)\s*(the\s*)?(owner|manager|supervisor|boss)/.test(lower)) {
        return 'owner_request';
    }
    if (/panel\s*upgrade|rewir(e|ing)|main\s*line|electrical\s*panel/.test(lower)) {
        return 'complex_electrical';
    }
    if (/sewer|water\s*heater\s*replac|main\s*water\s*line|repipe/.test(lower)) {
        return 'complex_plumbing';
    }

    return null;
}

module.exports = { handleEscalation, detectEscalationKeywords, ESCALATION_LABELS };
