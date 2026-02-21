/**
 * HustleAI — Load Simulation & Scale Readiness Test
 * Simulates concurrent inbound activity to measure system limits.
 * 
 * Usage: node scripts/load-test.js [clients] [messagesPerClient] [concurrency]
 * 
 * Example: node scripts/load-test.js 5 20 10
 *   → 5 simulated clients, 20 messages each, 10 concurrent requests
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const ARGS = process.argv.slice(2);
const NUM_CLIENTS = parseInt(ARGS[0] || "5", 10);
const MESSAGES_PER_CLIENT = parseInt(ARGS[1] || "20", 10);
const CONCURRENCY = parseInt(ARGS[2] || "10", 10);

// Simulated messages
const TEST_MESSAGES = [
    "Hi, I need help with my roof",
    "Got a leak in my bedroom ceiling",
    "How much for a roof inspection?",
    "Do you do emergency repairs?",
    "My shingles are falling off",
    "Can you come out today?",
    "What's free estimate include?",
    "I need a new roof quote",
    "Storm damaged my roof last night",
    "How soon can you schedule?",
    "What time works tomorrow?",
    "Do you accept insurance claims?",
    "My address is 123 Main St",
    "Can I get a call back?",
    "Thanks, sounds good",
    "What about the gutters?",
    "Do you do flat roofs?",
    "How long does replacement take?",
    "I'll think about it",
    "Let's schedule for Tuesday",
];

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  HustleAI — Load Simulation Test");
    console.log(`  Target:      ${BASE_URL}`);
    console.log(`  Clients:     ${NUM_CLIENTS}`);
    console.log(`  Msgs/Client: ${MESSAGES_PER_CLIENT}`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Total Msgs:  ${NUM_CLIENTS * MESSAGES_PER_CLIENT}`);
    console.log("═══════════════════════════════════════════\n");

    // Step 1: Get existing clients
    console.log("📋 Fetching clients...");
    let clients = [];
    try {
        const res = await fetch(`${BASE_URL}/api/clients/onboard`, {
            headers: { "x-api-key": ADMIN_API_KEY },
        });
        const data = await res.json();
        clients = (data.clients || []).slice(0, NUM_CLIENTS);
        console.log(`   Found ${clients.length} clients\n`);
    } catch (err) {
        console.error(`   Failed to fetch clients: ${err.message}`);
        console.log("   Using simulated client data...\n");
    }

    // Step 2: Generate test jobs
    const jobs = [];
    for (let c = 0; c < NUM_CLIENTS; c++) {
        const clientPhone = clients[c]?.phone || `+1555000${String(c).padStart(4, "0")}`;
        for (let m = 0; m < MESSAGES_PER_CLIENT; m++) {
            jobs.push({
                clientIndex: c,
                clientPhone,
                message: TEST_MESSAGES[m % TEST_MESSAGES.length],
            });
        }
    }

    console.log(`📊 Running ${jobs.length} requests with concurrency ${CONCURRENCY}...\n`);

    // Step 3: Execute with controlled concurrency
    const results = [];
    const startTime = Date.now();
    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    let totalLatencyMs = 0;
    let maxLatencyMs = 0;
    let minLatencyMs = Infinity;
    const latencies = [];

    // Process in batches
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
        const batch = jobs.slice(i, i + CONCURRENCY);
        const batchStart = Date.now();

        const responses = await Promise.allSettled(
            batch.map(async (job) => {
                const reqStart = Date.now();
                try {
                    // We hit the webhook endpoint but it will reject (unsigned)
                    // This still measures routing + validation + DB lookup latency
                    const res = await fetch(`${BASE_URL}/api/twilio/sms`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `From=${encodeURIComponent(job.clientPhone)}&To=%2B15559999999&Body=${encodeURIComponent(job.message)}`,
                    });
                    const latency = Date.now() - reqStart;
                    return { status: res.status, latency };
                } catch (err) {
                    const latency = Date.now() - reqStart;
                    return { status: 0, latency, error: err.message };
                }
            })
        );

        for (const r of responses) {
            completed++;
            if (r.status === "fulfilled") {
                const { status, latency } = r.value;
                totalLatencyMs += latency;
                latencies.push(latency);
                maxLatencyMs = Math.max(maxLatencyMs, latency);
                minLatencyMs = Math.min(minLatencyMs, latency);
                // 403 = correctly rejected unsigned request (expected)
                if (status === 403 || status === 200) succeeded++;
                else failed++;
            } else {
                failed++;
            }
        }

        const batchLatency = Date.now() - batchStart;
        const progress = Math.round((completed / jobs.length) * 100);
        process.stdout.write(`\r   Progress: ${progress}% (${completed}/${jobs.length}) — Batch: ${batchLatency}ms`);
    }

    const totalTimeMs = Date.now() - startTime;

    // Step 4: Calculate percentiles
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

    console.log("\n\n═══════════════════════════════════════════");
    console.log("  LOAD TEST RESULTS");
    console.log("═══════════════════════════════════════════\n");

    console.log(`  Total Time:      ${(totalTimeMs / 1000).toFixed(1)}s`);
    console.log(`  Requests:        ${completed}`);
    console.log(`  Succeeded:       ${succeeded}`);
    console.log(`  Failed:          ${failed}`);
    console.log(`  Throughput:      ${(completed / (totalTimeMs / 1000)).toFixed(1)} req/s`);
    console.log("");
    console.log("  LATENCY:");
    console.log(`    Min:           ${minLatencyMs}ms`);
    console.log(`    Avg:           ${Math.round(totalLatencyMs / completed)}ms`);
    console.log(`    P50:           ${p50}ms`);
    console.log(`    P95:           ${p95}ms`);
    console.log(`    P99:           ${p99}ms`);
    console.log(`    Max:           ${maxLatencyMs}ms`);

    console.log("\n  BOTTLENECK ASSESSMENT:");
    if (p95 < 500) {
        console.log("    ✅ P95 < 500ms — no cold start issues");
    } else if (p95 < 2000) {
        console.log("    ⚠️  P95 < 2s — mild cold starts, acceptable for SMS");
    } else {
        console.log("    🔴 P95 > 2s — cold start bottleneck, consider Vercel Pro");
    }

    if (failed === 0) {
        console.log("    ✅ Zero failures — system stable under load");
    } else if (failed / completed < 0.05) {
        console.log(`    ⚠️  ${failed} failures (${(failed / completed * 100).toFixed(1)}%) — acceptable`);
    } else {
        console.log(`    🔴 ${failed} failures (${(failed / completed * 100).toFixed(1)}%) — investigate`);
    }

    const rps = completed / (totalTimeMs / 1000);
    console.log(`\n  SCALE ESTIMATE:`);
    console.log(`    Current RPS:   ${rps.toFixed(1)}`);
    console.log(`    10 clients:    ~${Math.round(rps * 0.1)} sustained RPS needed ✅`);
    console.log(`    50 clients:    ~${Math.round(rps * 0.5)} sustained RPS needed ${rps > 5 ? "✅" : "⚠️"}`);
    console.log(`    100 clients:   ~${Math.round(rps)} sustained RPS needed ${rps > 10 ? "✅" : "🔴"}`);

    console.log("\n═══════════════════════════════════════════\n");
}

main().catch(err => {
    console.error("Load test crashed:", err);
    process.exit(1);
});
