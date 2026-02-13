/**
 * HustleAI — Market Scanner Agent
 * Scans businesses and identifies automation gaps using Gemini AI.
 */

const prisma = require("../prisma").default || require("../prisma");
const { askGemini } = require("./engine");
const { MARKET_SCANNER_PROMPT } = require("./prompts");

// Industries and locations to scan
const SCAN_TARGETS = [
    { industry: "Plumbing", locations: ["Las Vegas, NV", "Phoenix, AZ", "Denver, CO"] },
    { industry: "HVAC", locations: ["Phoenix, AZ", "Henderson, NV", "Scottsdale, AZ"] },
    { industry: "Electrical", locations: ["Los Angeles, CA", "San Diego, CA", "Las Vegas, NV"] },
    { industry: "Landscaping", locations: ["Denver, CO", "Dallas, TX", "Austin, TX"] },
    { industry: "Cleaning", locations: ["San Francisco, CA", "Seattle, WA", "Portland, OR"] },
    { industry: "Auto Repair", locations: ["Los Angeles, CA", "Houston, TX", "Chicago, IL"] },
    { industry: "Roofing", locations: ["Phoenix, AZ", "Tampa, FL", "Dallas, TX"] },
    { industry: "Pest Control", locations: ["Las Vegas, NV", "Miami, FL", "Atlanta, GA"] },
];

async function run(companyId) {
    // Pick a random industry + location to scan
    const target = SCAN_TARGETS[Math.floor(Math.random() * SCAN_TARGETS.length)];
    const location = target.locations[Math.floor(Math.random() * target.locations.length)];

    console.log(`[Scanner] Scanning ${target.industry} in ${location}...`);

    // Generate 3-5 realistic business profiles via Gemini
    const scanPrompt = `Generate 3 realistic service businesses in the ${target.industry} industry in ${location}.

For each business, provide:
- Business name (realistic local business name)
- Their specific problems (minimum 2 issues each)
- Potential rating: Critical, High, Medium, or Low

Return as JSON array:
[
  {
    "business": "Name",
    "potential": "High",
    "issues": ["issue1", "issue2"],
    "pitch_angle": "Why HustleAI helps them"
  }
]

Make these sound like REAL local businesses with REAL problems. Be creative with names.`;

    const result = await askGemini(MARKET_SCANNER_PROMPT, scanPrompt);

    let businesses = [];
    if (Array.isArray(result)) {
        businesses = result;
    } else if (result.raw) {
        // Try to extract array from raw text
        try {
            const match = result.raw.match(/\[[\s\S]*\]/);
            if (match) businesses = JSON.parse(match[0]);
        } catch (e) { /* ignore */ }
    }

    let created = 0;
    for (const biz of businesses) {
        if (!biz.business) continue;

        // Check for duplicate
        const existing = await prisma.marketOpportunity.findFirst({
            where: { companyId, business: biz.business },
        });
        if (existing) continue;

        await prisma.marketOpportunity.create({
            data: {
                companyId,
                business: biz.business,
                location,
                industry: target.industry,
                source: "AI Scan",
                potential: biz.potential || "Medium",
                issues: JSON.stringify(biz.issues || []),
            },
        });
        created++;
    }

    return {
        scanned: `${target.industry} in ${location}`,
        found: businesses.length,
        created,
        duplicatesSkipped: businesses.length - created,
    };
}

module.exports = { run };
