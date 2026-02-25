/**
 * HustleAI — Email Listener (IMAP)
 * Connects to Gmail (majorpremiumllc@gmail.com) via IMAP and watches for
 * incoming Yelp/Thumbtack lead notification emails.
 *
 * When a new notification arrives:
 * 1. Parses the email HTML to extract lead data (name, phone, job type)
 * 2. Saves the lead to the database via Lead Ingest API
 * 3. Triggers the Lead Responder agent for instant SMS + call + platform reply
 *
 * SETUP REQUIRED:
 * - Enable IMAP in Gmail settings (Settings > See all settings > Forwarding and POP/IMAP)
 * - Generate an App Password: Google Account > Security > 2-Step Verification > App Passwords
 * - Set environment variables:
 *   GMAIL_USER=majorpremiumllc@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 */

const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
const prisma = require("./prisma").default || require("./prisma");

// ── Configuration ─────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER || "majorpremiumllc@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const CHECK_INTERVAL = 30_000; // Check every 30 seconds
const KNOWN_SENDERS = {
    thumbtack: ["noreply@thumbtack.com", "notifications@thumbtack.com", "leads@thumbtack.com"],
    yelp: ["noreply@yelp.com", "notify@yelp.com", "no-reply@yelp.com", "biz-noreply@yelp.com"],
};

let isRunning = false;
let imapConnection = null;

// ── Start Listener ────────────────────────────────────
function startEmailListener() {
    if (!GMAIL_APP_PASSWORD) {
        console.log("[Email Listener] ⚠ GMAIL_APP_PASSWORD not set. Email listener disabled.");
        console.log("[Email Listener] Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to enable.");
        return;
    }

    if (isRunning) {
        console.log("[Email Listener] Already running.");
        return;
    }

    isRunning = true;
    console.log(`[Email Listener] 🚀 Starting IMAP listener for ${GMAIL_USER}`);
    connectAndWatch();
}

function stopEmailListener() {
    isRunning = false;
    if (imapConnection) {
        try { imapConnection.end(); } catch (e) { /* */ }
        imapConnection = null;
    }
    console.log("[Email Listener] ⏹ Stopped.");
}

// ── IMAP Connection ───────────────────────────────────
function connectAndWatch() {
    const imap = new Imap({
        user: GMAIL_USER,
        password: GMAIL_APP_PASSWORD,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
    });

    imapConnection = imap;

    imap.once("ready", () => {
        console.log("[Email Listener] ✅ Connected to Gmail IMAP");
        openInbox(imap);
    });

    imap.once("error", (err) => {
        console.error("[Email Listener] ❌ IMAP error:", err.message);
        scheduleReconnect();
    });

    imap.once("end", () => {
        console.log("[Email Listener] 📴 IMAP connection ended.");
        if (isRunning) scheduleReconnect();
    });

    imap.connect();
}

function scheduleReconnect() {
    if (!isRunning) return;
    console.log("[Email Listener] ♻ Reconnecting in 30 seconds...");
    setTimeout(connectAndWatch, 30000);
}

function openInbox(imap) {
    imap.openBox("INBOX", false, (err) => {
        if (err) {
            console.error("[Email Listener] ❌ Failed to open INBOX:", err.message);
            return;
        }

        // Listen for new emails in real-time
        imap.on("mail", () => {
            console.log("[Email Listener] 📬 New email detected!");
            checkNewEmails(imap);
        });

        // Also do an initial check for unseen emails
        checkNewEmails(imap);
    });
}

// ── Check for New Emails ──────────────────────────────
function checkNewEmails(imap) {
    imap.search(["UNSEEN"], (err, uids) => {
        if (err) {
            console.error("[Email Listener] Search error:", err.message);
            return;
        }

        if (!uids || uids.length === 0) return;

        console.log(`[Email Listener] Found ${uids.length} unread emails`);

        const fetch = imap.fetch(uids, {
            bodies: "",
            markSeen: true,
        });

        fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
                simpleParser(stream, async (parseErr, parsed) => {
                    if (parseErr) {
                        console.error("[Email Listener] Parse error:", parseErr.message);
                        return;
                    }

                    await processEmail(parsed);
                });
            });
        });

        fetch.once("error", (fetchErr) => {
            console.error("[Email Listener] Fetch error:", fetchErr.message);
        });
    });
}

// ── Process a Single Email ────────────────────────────
async function processEmail(parsed) {
    const fromAddress = parsed.from?.value?.[0]?.address?.toLowerCase() || "";
    const subject = parsed.subject || "";
    const htmlBody = parsed.html || "";
    const textBody = parsed.text || "";
    const replyTo = parsed.replyTo?.value?.[0]?.address || parsed.from?.value?.[0]?.address || "";

    // Determine platform
    let platform = null;
    if (KNOWN_SENDERS.thumbtack.some((s) => fromAddress.includes(s.split("@")[0]))) {
        platform = "Thumbtack";
    } else if (KNOWN_SENDERS.yelp.some((s) => fromAddress.includes(s.split("@")[0]))) {
        platform = "Yelp";
    }

    if (!platform) {
        // Not a lead notification — skip
        return;
    }

    console.log(`[Email Listener] 🎯 ${platform} notification detected: "${subject}"`);

    // Parse lead data from email content
    const leadData = platform === "Thumbtack"
        ? parseThumbtackEmail(subject, htmlBody, textBody, replyTo)
        : parseYelpEmail(subject, htmlBody, textBody, replyTo);

    if (!leadData.customerName && !leadData.customerPhone) {
        console.log(`[Email Listener] ⚠ Could not parse lead data from ${platform} email: ${subject}`);
        return;
    }

    console.log(`[Email Listener] 📋 Parsed lead: ${JSON.stringify(leadData)}`);

    // Save lead to DB
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            console.error("[Email Listener] No company found in DB");
            return;
        }

        // Check for duplicate (same phone + source within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const existing = await prisma.lead.findFirst({
            where: {
                companyId: company.id,
                customerPhone: leadData.customerPhone || "none",
                source: platform,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (existing) {
            console.log(`[Email Listener] ⚠ Duplicate lead (${leadData.customerPhone}) — skipping`);
            return;
        }

        // Create lead
        const lead = await prisma.lead.create({
            data: {
                companyId: company.id,
                customerName: leadData.customerName || "Unknown",
                customerPhone: leadData.customerPhone || "",
                customerEmail: leadData.customerEmail || null,
                jobType: leadData.jobType || "General",
                notes: leadData.description || `${platform} lead`,
                source: platform,
                status: "new",
                urgency: leadData.urgency || "Flexible",
            },
        });

        console.log(`[Email Listener] ✅ Lead saved: ${lead.id} — ${leadData.customerName}`);

        // Trigger Lead Responder Agent
        const { respondToLead } = require("./agents/lead-responder");
        await respondToLead(company.id, {
            ...leadData,
            source: platform,
            replyToEmail: leadData.replyToEmail || replyTo,
        });

    } catch (dbErr) {
        console.error("[Email Listener] ❌ DB error:", dbErr.message);
    }
}

// ── Parse Thumbtack Notification Email ────────────────
function parseThumbtackEmail(subject, html, text, replyTo) {
    const lead = {
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        jobType: null,
        description: null,
        replyToEmail: replyTo,
    };

    // Common Thumbtack subject: "New lead: John D. needs Handyman"
    const subjectMatch = subject.match(/(?:New lead|New message|New request)[:\s]*(.+?)(?:\s+needs?\s+)(.+)/i);
    if (subjectMatch) {
        lead.customerName = subjectMatch[1].trim();
        lead.jobType = subjectMatch[2].trim();
    }

    // Extract from HTML body
    const content = html || text;

    // Name extraction patterns
    const namePatterns = [
        /(?:from|customer|client|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/i,
        /(?:Hi|Hello|Hey),?\s*([A-Z][a-z]+)/i,
        /([A-Z][a-z]+(?:\s+[A-Z]\.?))\s+(?:needs?|wants?|is looking for|sent)/i,
    ];
    for (const pat of namePatterns) {
        if (lead.customerName) break;
        const m = content.match(pat);
        if (m) lead.customerName = m[1].trim();
    }

    // Phone extraction
    const phoneMatch = content.match(/(?:\+?1?\s*)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) {
        lead.customerPhone = phoneMatch[0].replace(/[^\d+]/g, "");
        if (lead.customerPhone.length === 10) lead.customerPhone = "+1" + lead.customerPhone;
    }

    // Job type from body
    if (!lead.jobType) {
        const jobPatterns = [
            /(?:project|job|service|looking for|needs?)[:\s]+(.+?)(?:\.|<|$)/im,
            /(?:Handyman|Drywall|Painting|Accent Wall|Fireplace|TV Mount|Furniture|Carpentry|Plumbing|Electrical)/i,
        ];
        for (const pat of jobPatterns) {
            const m = content.match(pat);
            if (m) { lead.jobType = (m[1] || m[0]).trim(); break; }
        }
    }

    // Description from body (first substantial paragraph)
    const descMatch = content.match(/(?:details?|description|message|notes?)[:\s]+(.{10,300}?)(?:<|$)/is);
    if (descMatch) lead.description = descMatch[1].replace(/<[^>]+>/g, "").trim();

    return lead;
}

// ── Parse Yelp Notification Email ─────────────────────
function parseYelpEmail(subject, html, text, replyTo) {
    const lead = {
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        jobType: null,
        description: null,
        replyToEmail: replyTo,
    };

    // Common Yelp subject: "You have a new request from John D." or "New message from John"
    const subjectMatch = subject.match(/(?:new (?:request|message|quote|inquiry) from|from)\s+(.+?)(?:\s*$|\s*-)/i);
    if (subjectMatch) {
        lead.customerName = subjectMatch[1].trim();
    }

    const content = html || text;

    // Name from body
    if (!lead.customerName) {
        const nameMatch = content.match(/(?:from|customer|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/i);
        if (nameMatch) lead.customerName = nameMatch[1].trim();
    }

    // Phone extraction
    const phoneMatch = content.match(/(?:\+?1?\s*)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) {
        lead.customerPhone = phoneMatch[0].replace(/[^\d+]/g, "");
        if (lead.customerPhone.length === 10) lead.customerPhone = "+1" + lead.customerPhone;
    }

    // Job type
    const jobMatch = content.match(/(?:services?|project|looking for|request for|category)[:\s]+(.+?)(?:<|\.|$)/im);
    if (jobMatch) lead.jobType = jobMatch[1].replace(/<[^>]+>/g, "").trim();

    // Description
    const descMatch = content.match(/(?:message|details?|description|notes?)[:\s]+(.{10,300}?)(?:<|$)/is);
    if (descMatch) lead.description = descMatch[1].replace(/<[^>]+>/g, "").trim();

    return lead;
}

// ── Manual check command (for testing) ────────────────
async function checkOnce() {
    if (!GMAIL_APP_PASSWORD) {
        console.log("[Email Listener] ⚠ Set GMAIL_APP_PASSWORD to test.");
        return;
    }

    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: GMAIL_USER,
            password: GMAIL_APP_PASSWORD,
            host: "imap.gmail.com",
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
        });

        imap.once("ready", () => {
            imap.openBox("INBOX", false, (err) => {
                if (err) { reject(err); return; }
                checkNewEmails(imap);
                setTimeout(() => {
                    imap.end();
                    resolve("Done");
                }, 5000);
            });
        });

        imap.once("error", reject);
        imap.connect();
    });
}

module.exports = {
    startEmailListener,
    stopEmailListener,
    checkOnce,
    // Exported for testing
    parseThumbtackEmail,
    parseYelpEmail,
};
