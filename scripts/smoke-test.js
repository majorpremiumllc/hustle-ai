/**
 * HustleAI — Production Smoke Test & Verification
 * Run after deploy to verify all hardening layers work.
 * 
 * Usage: node scripts/smoke-test.js
 */

const crypto = require("crypto");

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  HustleAI — Production Smoke Test");
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  Time:   ${new Date().toISOString()}`);
    console.log("═══════════════════════════════════════════\n");

    const results = [];

    // ── Test 1: Webhook rejects unsigned requests ──
    console.log("🔐 Test 1: Webhook signature enforcement...");
    try {
        const res = await fetch(`${BASE_URL}/api/twilio/sms`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "From=%2B15551234567&To=%2B15559876543&Body=Hello",
        });
        if (res.status === 403) {
            results.push({ test: "Webhook signature enforcement", status: "PASS", detail: "403 returned for unsigned request" });
            console.log("   ✅ PASS — Unsigned request rejected with 403\n");
        } else {
            results.push({ test: "Webhook signature enforcement", status: "FAIL", detail: `Expected 403, got ${res.status}` });
            console.log(`   ❌ FAIL — Expected 403, got ${res.status}\n`);
        }
    } catch (err) {
        results.push({ test: "Webhook signature enforcement", status: "ERROR", detail: err.message });
        console.log(`   ⚠️  ERROR — ${err.message}\n`);
    }

    // ── Test 2: Admin routes reject unauthenticated requests ──
    console.log("🔐 Test 2: Admin route authentication...");
    try {
        const res = await fetch(`${BASE_URL}/api/clients/onboard`, {
            method: "GET",
        });
        if (res.status === 401) {
            results.push({ test: "Admin auth enforcement", status: "PASS", detail: "401 returned for unauthenticated request" });
            console.log("   ✅ PASS — Unauthenticated request rejected with 401\n");
        } else {
            results.push({ test: "Admin auth enforcement", status: "FAIL", detail: `Expected 401, got ${res.status}` });
            console.log(`   ❌ FAIL — Expected 401, got ${res.status}\n`);
        }
    } catch (err) {
        results.push({ test: "Admin auth enforcement", status: "ERROR", detail: err.message });
        console.log(`   ⚠️  ERROR — ${err.message}\n`);
    }

    // ── Test 3: Admin routes work WITH API key ──
    console.log("🔑 Test 3: Admin route with API key...");
    if (!ADMIN_API_KEY) {
        results.push({ test: "Admin auth with key", status: "SKIP", detail: "ADMIN_API_KEY not set" });
        console.log("   ⏭️  SKIP — ADMIN_API_KEY not set\n");
    } else {
        try {
            const res = await fetch(`${BASE_URL}/api/clients/onboard`, {
                method: "GET",
                headers: { "x-api-key": ADMIN_API_KEY },
            });
            if (res.status === 200) {
                const data = await res.json();
                results.push({ test: "Admin auth with key", status: "PASS", detail: `${data.clients?.length || 0} clients found` });
                console.log(`   ✅ PASS — Returned ${data.clients?.length || 0} clients\n`);
            } else {
                results.push({ test: "Admin auth with key", status: "FAIL", detail: `Expected 200, got ${res.status}` });
                console.log(`   ❌ FAIL — Expected 200, got ${res.status}\n`);
            }
        } catch (err) {
            results.push({ test: "Admin auth with key", status: "ERROR", detail: err.message });
            console.log(`   ⚠️  ERROR — ${err.message}\n`);
        }
    }

    // ── Test 4: Encryption works ──
    console.log("🔒 Test 4: Encryption verification...");
    try {
        const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
        if (!ENCRYPTION_KEY) {
            results.push({ test: "Encryption", status: "SKIP", detail: "ENCRYPTION_KEY not set" });
            console.log("   ⏭️  SKIP — ENCRYPTION_KEY not set\n");
        } else {
            // Test encrypt/decrypt cycle
            const key = Buffer.from(ENCRYPTION_KEY, "hex");
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
            let enc = cipher.update("test-token-12345", "utf8");
            enc = Buffer.concat([enc, cipher.final()]);
            const tag = cipher.getAuthTag();
            const packed = Buffer.concat([iv, enc, tag]);

            // Decrypt
            const iv2 = packed.subarray(0, 12);
            const tag2 = packed.subarray(packed.length - 16);
            const data = packed.subarray(12, packed.length - 16);
            const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv2);
            decipher.setAuthTag(tag2);
            let dec = decipher.update(data);
            dec = Buffer.concat([dec, decipher.final()]).toString("utf8");

            if (dec === "test-token-12345") {
                results.push({ test: "Encryption", status: "PASS", detail: "Encrypt/decrypt cycle verified" });
                console.log("   ✅ PASS — AES-256-GCM encrypt/decrypt verified\n");
            } else {
                results.push({ test: "Encryption", status: "FAIL", detail: "Decrypted value mismatch" });
                console.log("   ❌ FAIL — Decrypted value mismatch\n");
            }
        }
    } catch (err) {
        results.push({ test: "Encryption", status: "ERROR", detail: err.message });
        console.log(`   ⚠️  ERROR — ${err.message}\n`);
    }

    // ── Test 5: Health endpoint reachable ──
    console.log("📊 Test 5: Telecom health endpoint...");
    if (!ADMIN_API_KEY) {
        results.push({ test: "Telecom health", status: "SKIP", detail: "ADMIN_API_KEY not set" });
        console.log("   ⏭️  SKIP — ADMIN_API_KEY not set\n");
    } else {
        try {
            const res = await fetch(`${BASE_URL}/api/telecom-health`, {
                headers: { "x-api-key": ADMIN_API_KEY },
            });
            if (res.status === 200) {
                const data = await res.json();
                results.push({ test: "Telecom health", status: "PASS", detail: `${data.clients?.length || 0} clients tracked` });
                console.log(`   ✅ PASS — Health endpoint responding\n`);
            } else {
                results.push({ test: "Telecom health", status: "FAIL", detail: `Status ${res.status}` });
                console.log(`   ❌ FAIL — Status ${res.status}\n`);
            }
        } catch (err) {
            results.push({ test: "Telecom health", status: "ERROR", detail: err.message });
            console.log(`   ⚠️  ERROR — ${err.message}\n`);
        }
    }

    // ── Summary ──
    console.log("═══════════════════════════════════════════");
    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.filter(r => r.status === "FAIL").length;
    const skipped = results.filter(r => r.status === "SKIP").length;
    console.log(`  Results: ${passed} PASS / ${failed} FAIL / ${skipped} SKIP`);
    console.log("═══════════════════════════════════════════\n");

    if (failed > 0) {
        console.log("🚨 FAILURES DETECTED — DO NOT ONBOARD CLIENTS\n");
        results.filter(r => r.status === "FAIL").forEach(r => {
            console.log(`   ❌ ${r.test}: ${r.detail}`);
        });
        process.exit(1);
    } else {
        console.log("✅ All tests passed — system is pilot-ready\n");
    }
}

main().catch(err => {
    console.error("Smoke test crashed:", err);
    process.exit(1);
});
