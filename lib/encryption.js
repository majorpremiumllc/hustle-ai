/**
 * HustleAI — AES-256 Encryption for Sensitive Credentials
 * Encrypts Twilio subaccount tokens before DB storage.
 * Decrypts only at runtime when needed.
 * 
 * Key stored in ENCRYPTION_KEY environment variable (32-byte hex).
 * Uses AES-256-GCM for authenticated encryption.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;  // GCM recommended IV length
const TAG_LENGTH = 16; // GCM auth tag length

/**
 * Get the 32-byte encryption key from env var.
 * @returns {Buffer}
 */
function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error("ENCRYPTION_KEY environment variable not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    }
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
        throw new Error(`ENCRYPTION_KEY must be 32 bytes (64 hex chars). Got ${key.length} bytes.`);
    }
    return key;
}

/**
 * Encrypt a plaintext string.
 * Returns: base64 string of (iv + ciphertext + authTag)
 * 
 * @param {string} plaintext - The value to encrypt
 * @returns {string} Encrypted value (base64)
 */
export function encrypt(plaintext) {
    if (!plaintext) return null;

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Pack: iv (12) + encrypted (variable) + authTag (16)
    const packed = Buffer.concat([iv, encrypted, authTag]);
    return packed.toString("base64");
}

/**
 * Decrypt an encrypted string.
 * Input: base64 string of (iv + ciphertext + authTag)
 * 
 * @param {string} encryptedBase64 - The encrypted value (base64)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedBase64) {
    if (!encryptedBase64) return null;

    const key = getKey();
    const packed = Buffer.from(encryptedBase64, "base64");

    // Unpack: iv (12) + encrypted (variable) + authTag (16)
    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(packed.length - TAG_LENGTH);
    const encrypted = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
}

/**
 * Encrypt Twilio credentials for a company before storing in DB.
 * @param {string} subAccountSid - Twilio subaccount SID (not encrypted — it's a public identifier)
 * @param {string} authToken - Twilio auth token (MUST be encrypted)
 * @returns {{ twilioSubAccountSid: string, twilioSubAuthToken: string }}
 */
export function encryptTwilioCredentials(subAccountSid, authToken) {
    return {
        twilioSubAccountSid: subAccountSid,  // SIDs are public identifiers, no encryption needed
        twilioSubAuthToken: encrypt(authToken),
    };
}

/**
 * Decrypt Twilio auth token from DB for runtime use.
 * @param {object} company - Company record from Prisma
 * @returns {{ sid: string, authToken: string }}
 */
export function decryptTwilioCredentials(company) {
    if (!company.twilioSubAccountSid || !company.twilioSubAuthToken) {
        return { sid: null, authToken: null };
    }
    return {
        sid: company.twilioSubAccountSid,
        authToken: decrypt(company.twilioSubAuthToken),
    };
}

/**
 * Generate a new encryption key (utility function).
 * Run: node -e "require('./lib/encryption.js').generateKey()"
 */
export function generateKey() {
    const key = crypto.randomBytes(32).toString("hex");
    console.log(`\nGenerated ENCRYPTION_KEY:\n${key}\n\nAdd to .env.local:\nENCRYPTION_KEY=${key}\n`);
    return key;
}
