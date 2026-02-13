/**
 * Seed Outreach & Market demo data
 * Run: node prisma/seed-outreach-market.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Get first company
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log("No company found. Run the app first to create one.");
        return;
    }

    console.log(`Seeding data for company: ${company.name} (${company.id})`);

    // ── Outreach Campaigns ─────────────────────
    const campaigns = [
        {
            name: "HVAC Companies — Phoenix, AZ",
            channel: "Email + SMS",
            status: "active",
            sent: 142, opened: 89, replied: 23, converted: 7,
        },
        {
            name: "Plumbing Services — Las Vegas, NV",
            channel: "Email",
            status: "active",
            sent: 98, opened: 61, replied: 15, converted: 4,
        },
        {
            name: "Landscaping — Denver, CO",
            channel: "SMS",
            status: "paused",
            sent: 76, opened: 45, replied: 11, converted: 3,
        },
        {
            name: "Auto Repair — Los Angeles, CA",
            channel: "Email + Call",
            status: "draft",
            sent: 0, opened: 0, replied: 0, converted: 0,
        },
    ];

    for (const c of campaigns) {
        const existing = await prisma.outreachCampaign.findFirst({
            where: { companyId: company.id, name: c.name },
        });
        if (!existing) {
            const created = await prisma.outreachCampaign.create({
                data: { companyId: company.id, ...c },
            });

            // Add demo contacts to active campaigns
            if (c.status === "active") {
                const contacts = [
                    { name: "Johnson Plumbing", phone: "+1 (702) 555-0142", status: "replied", lastMsg: "Interested in automation" },
                    { name: "Cool Air HVAC", phone: "+1 (602) 555-0198", status: "opened", lastMsg: "—" },
                    { name: "GreenStar Landscaping", phone: "+1 (303) 555-0167", status: "converted", lastMsg: "Signed up for trial" },
                ];
                for (const ct of contacts) {
                    await prisma.outreachContact.create({
                        data: { campaignId: created.id, ...ct },
                    });
                }
            }
            console.log(`  ✅ Campaign: ${c.name}`);
        } else {
            console.log(`  ⏭ Campaign exists: ${c.name}`);
        }
    }

    // ── Market Opportunities ───────────────────
    const opportunities = [
        {
            business: "Valley Plumbing LLC", location: "Las Vegas, NV", industry: "Plumbing",
            source: "Google", potential: "High",
            issues: JSON.stringify(["No website", "2.1★ rating", "No online booking"]),
        },
        {
            business: "Quick Fix Electric", location: "Phoenix, AZ", industry: "Electrical",
            source: "Yelp", potential: "High",
            issues: JSON.stringify(["Slow response (48h+)", "No SMS", "Missing reviews"]),
        },
        {
            business: "Desert Cool HVAC", location: "Henderson, NV", industry: "HVAC",
            source: "Thumbtack", potential: "Medium",
            issues: JSON.stringify(["No auto-reply", "3.2★ rating", "No call answering"]),
        },
        {
            business: "Fresh Cuts Landscaping", location: "Denver, CO", industry: "Landscaping",
            source: "Google", potential: "Medium",
            issues: JSON.stringify(["Outdated website", "No mobile optimization", "No reviews in 6mo"]),
        },
        {
            business: "Joe's Auto Care", location: "Los Angeles, CA", industry: "Auto Repair",
            source: "Yelp", potential: "Critical",
            issues: JSON.stringify(["1.8★ rating", "Multiple complaints", "No follow-up system"]),
        },
        {
            business: "Sparkle Clean Co", location: "San Diego, CA", industry: "Cleaning",
            source: "Google", potential: "High",
            issues: JSON.stringify(["No Google Business Profile", "No online presence", "Phone only"]),
        },
    ];

    for (const o of opportunities) {
        const existing = await prisma.marketOpportunity.findFirst({
            where: { companyId: company.id, business: o.business },
        });
        if (!existing) {
            await prisma.marketOpportunity.create({
                data: { companyId: company.id, ...o },
            });
            console.log(`  ✅ Market: ${o.business}`);
        } else {
            console.log(`  ⏭ Market exists: ${o.business}`);
        }
    }

    console.log("\n🎉 Seeding complete!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
