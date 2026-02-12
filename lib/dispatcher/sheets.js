// ─────────────────────────────────────────────
// Google Sheets — Lead Storage
// ─────────────────────────────────────────────

const { google } = require('googleapis');

let sheetsClient = null;

/**
 * Initialize the Google Sheets API client using a service account.
 */
async function initSheets() {
    if (sheetsClient) return sheetsClient;

    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        console.warn('[Sheets] Google Sheets credentials not configured — leads will only be logged to console.');
        return null;
    }

    const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        privateKey.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets'],
    );

    await auth.authorize();
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('[Sheets] Google Sheets client initialized.');
    return sheetsClient;
}

/**
 * Append a lead row to the configured Google Sheet.
 *
 * @param {Object} lead - Lead data
 * @returns {boolean} Success flag
 */
async function appendLead(lead) {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
        console.warn('[Sheets] GOOGLE_SHEET_ID not set, skipping.');
        return false;
    }

    const sheets = await initSheets();
    if (!sheets) return false;

    const row = [
        lead.timestamp || new Date().toISOString(),
        lead.customer_name || '',
        lead.phone_number || '',
        lead.job_type || '',
        lead.address || '',
        lead.urgency || '',
        lead.preferred_date || '',
        lead.notes || '',
        lead.has_photos ? 'Yes' : 'No',
        lead.source || 'Unknown',
        lead.status || 'New',
        lead.call_sid || '',
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Leads!A:L',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
        });

        console.log(`[Sheets] Lead saved: ${lead.customer_name} — ${lead.job_type}`);
        return true;
    } catch (err) {
        console.error('[Sheets] Failed to save lead:', err.message);
        return false;
    }
}

/**
 * Ensure the sheet has the correct header row.
 * Call this once during setup.
 */
async function ensureHeaders() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheets = await initSheets();
    if (!sheets || !sheetId) return;

    const headers = [
        'Timestamp',
        'Customer Name',
        'Phone',
        'Job Type',
        'Address',
        'Urgency',
        'Preferred Date',
        'Notes',
        'Has Photos',
        'Source',
        'Status',
        'Call SID',
    ];

    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Leads!A1:L1',
        });

        if (!result.data.values || result.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'Leads!A1:L1',
                valueInputOption: 'RAW',
                requestBody: { values: [headers] },
            });
            console.log('[Sheets] Header row created.');
        }
    } catch (err) {
        console.error('[Sheets] Failed to ensure headers:', err.message);
    }
}

module.exports = { appendLead, ensureHeaders, initSheets };
