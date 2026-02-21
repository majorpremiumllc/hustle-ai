/**
 * HustleAI — Multi-Tenant Twilio Manager
 * Handles subaccount creation, number provisioning, and webhook configuration.
 * Each client gets an isolated Twilio subaccount with their own numbers and logs.
 */

const twilio = require("twilio");

const MASTER_SID = process.env.TWILIO_ACCOUNT_SID;
const MASTER_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";

/**
 * Get the master Twilio client.
 */
function getMasterClient() {
    if (!MASTER_SID || !MASTER_TOKEN) {
        throw new Error("Twilio master credentials not configured");
    }
    return twilio(MASTER_SID, MASTER_TOKEN);
}

/**
 * Get a Twilio client for a specific subaccount.
 * @param {string} subAccountSid - Subaccount SID
 * @param {string} subAuthToken - Subaccount auth token
 */
function getSubClient(subAccountSid, subAuthToken) {
    return twilio(subAccountSid, subAuthToken);
}

// ═══════════════════════════════════════
// SUBACCOUNT MANAGEMENT
// ═══════════════════════════════════════

/**
 * Create an isolated Twilio subaccount for a new client.
 * @param {string} businessName - Client's business name (e.g., "Smith Roofing")
 * @returns {Promise<{ sid: string, authToken: string }>}
 */
async function createSubaccount(businessName) {
    const client = getMasterClient();
    const account = await client.api.accounts.create({
        friendlyName: `HustleAI - ${businessName}`,
    });
    console.log(`[Twilio] Created subaccount: ${account.sid} for "${businessName}"`);
    return {
        sid: account.sid,
        authToken: account.authToken,
    };
}

/**
 * Purchase a local phone number in the client's area code.
 * @param {string} subAccountSid - Subaccount SID
 * @param {string} subAuthToken - Subaccount auth token
 * @param {string} areaCode - Desired area code (e.g., "702")
 * @param {string} label - Friendly label (e.g., "Smith Roofing - Main")
 * @returns {Promise<{ phoneNumber: string, sid: string }>}
 */
async function purchaseLocalNumber(subAccountSid, subAuthToken, areaCode, label = "Main") {
    const client = getSubClient(subAccountSid, subAuthToken);

    // Search for available local numbers in the area code
    const available = await client.availablePhoneNumbers("US").local.list({
        areaCode,
        smsEnabled: true,
        voiceEnabled: true,
        limit: 5,
    });

    if (available.length === 0) {
        throw new Error(`No available numbers in area code ${areaCode}`);
    }

    // Purchase the first available number
    const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available[0].phoneNumber,
        friendlyName: `HustleAI - ${label}`,
        voiceUrl: `${BASE_URL}/api/twilio/voice`,
        voiceMethod: "POST",
        voiceFallbackUrl: `${BASE_URL}/api/twilio/voice`,
        smsUrl: `${BASE_URL}/api/twilio/sms`,
        smsMethod: "POST",
        statusCallback: `${BASE_URL}/api/twilio/status`,
        statusCallbackMethod: "POST",
    });

    console.log(`[Twilio] Purchased ${purchased.phoneNumber} (${purchased.sid}) for subaccount ${subAccountSid}`);

    return {
        phoneNumber: purchased.phoneNumber,
        sid: purchased.sid,
    };
}

/**
 * Configure webhooks for an existing phone number.
 * @param {string} subAccountSid - Subaccount SID
 * @param {string} subAuthToken - Subaccount auth token
 * @param {string} numberSid - Phone number SID
 */
async function configureWebhooks(subAccountSid, subAuthToken, numberSid) {
    const client = getSubClient(subAccountSid, subAuthToken);

    await client.incomingPhoneNumbers(numberSid).update({
        voiceUrl: `${BASE_URL}/api/twilio/voice`,
        voiceMethod: "POST",
        smsUrl: `${BASE_URL}/api/twilio/sms`,
        smsMethod: "POST",
        statusCallback: `${BASE_URL}/api/twilio/status`,
        statusCallbackMethod: "POST",
    });

    console.log(`[Twilio] Configured webhooks for ${numberSid}`);
}

/**
 * Send SMS through a client's subaccount.
 * @param {string} subAccountSid - Subaccount SID
 * @param {string} subAuthToken - Subaccount auth token
 * @param {string} from - From phone number (client's Twilio number)
 * @param {string} to - Recipient phone number
 * @param {string} body - Message text
 */
async function sendSMS(subAccountSid, subAuthToken, from, to, body) {
    const client = getSubClient(subAccountSid, subAuthToken);

    const message = await client.messages.create({
        from,
        to,
        body,
    });

    console.log(`[Twilio] Sent SMS ${message.sid}: ${from} → ${to}`);
    return message;
}

/**
 * Send missed-call text-back for a client.
 * @param {object} company - Company record from DB
 * @param {string} callerPhone - Caller's phone number
 * @param {string} companyPhone - Company's Twilio number
 */
async function sendMissedCallTextBack(company, callerPhone, companyPhone) {
    if (!company.missedCallTextBack) return null;

    const message = company.missedCallMessage ||
        `Hi! Sorry we missed your call. This is ${company.name}. How can we help? Reply here or call us back at ${company.phone || companyPhone}. 😊`;

    // Use subaccount if available, otherwise master account
    if (company.twilioSubAccountSid && company.twilioSubAuthToken) {
        return sendSMS(company.twilioSubAccountSid, company.twilioSubAuthToken, companyPhone, callerPhone, message);
    }

    // Fallback to master account
    const client = getMasterClient();
    const result = await client.messages.create({
        from: companyPhone,
        to: callerPhone,
        body: message,
    });
    console.log(`[Twilio] Missed-call text-back sent: ${result.sid}`);
    return result;
}

/**
 * List all phone numbers for a subaccount.
 */
async function listSubaccountNumbers(subAccountSid, subAuthToken) {
    const client = getSubClient(subAccountSid, subAuthToken);
    return client.incomingPhoneNumbers.list();
}

module.exports = {
    getMasterClient,
    getSubClient,
    createSubaccount,
    purchaseLocalNumber,
    configureWebhooks,
    sendSMS,
    sendMissedCallTextBack,
    listSubaccountNumbers,
};
