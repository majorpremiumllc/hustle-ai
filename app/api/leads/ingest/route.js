/**
 * HustleAI — Lead Ingest API
 * Receives lead data from any source (Thumbtack, Yelp, manual entry, webhook)
 * and stores it in the database.
 */

import { NextResponse } from "next/server";

// In-memory lead store (will be replaced with Prisma in production)
// We use a global variable to persist across hot reloads
if (!global.__hustleai_leads) {
    global.__hustleai_leads = [
        {
            id: "lead_001",
            source: "Thumbtack",
            customerName: "Sarah M.",
            customerPhone: "(725) 555-0142",
            customerEmail: "sarah.m@gmail.com",
            jobType: "Furniture Assembly",
            description: "I need help assembling a large IKEA wardrobe (PAX system) and a desk. Located in Henderson. Flexible on timing but prefer this weekend.",
            urgency: "Flexible",
            status: "new",
            aiReply: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
        },
        {
            id: "lead_002",
            source: "Yelp",
            customerName: "David K.",
            customerPhone: "(702) 555-0198",
            customerEmail: "david.k@outlook.com",
            jobType: "TV Mounting",
            description: "Need a 75-inch TV mounted on a brick wall in the living room. Also need cable management done. When can you come out?",
            urgency: "ASAP",
            status: "new",
            aiReply: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
        },
        {
            id: "lead_003",
            source: "Thumbtack",
            customerName: "Jennifer L.",
            customerPhone: "(725) 555-0233",
            customerEmail: null,
            jobType: "Drywall Repair",
            description: "Multiple holes in the drywall from removing shelves. About 5-6 holes ranging from small to medium size. Need them patched and painted. House in Summerlin.",
            urgency: "Flexible",
            status: "contacted",
            aiReply: "Hi Jennifer! Thanks for reaching out. I'd be happy to help with your drywall repair. For 5-6 holes with patching and paint touch-up, I can typically complete that in one visit. I have availability this Thursday or Friday. Would either of those work? Feel free to send photos so I can give you an accurate estimate!",
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        },
        {
            id: "lead_004",
            source: "SMS",
            customerName: "Mike R.",
            customerPhone: "(702) 555-0177",
            customerEmail: null,
            jobType: "General Repair",
            description: "Hey, I've got a leaky kitchen faucet and a door that won't close properly. Can you come take a look? I'm near the strip.",
            urgency: "ASAP",
            status: "new",
            aiReply: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
        },
        {
            id: "lead_005",
            source: "Yelp",
            customerName: "Lisa T.",
            customerPhone: "(725) 555-0301",
            customerEmail: "lisa.t@yahoo.com",
            jobType: "Picture Hanging & Shelving",
            description: "Just moved into a new apartment. Need about 10 pictures hung and 3 floating shelves installed. Would like it done ASAP if possible.",
            urgency: "ASAP",
            status: "new",
            aiReply: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
        },
        {
            id: "lead_006",
            source: "Thumbtack",
            customerName: "Robert C.",
            customerPhone: "(702) 555-0422",
            customerEmail: "robert.c@gmail.com",
            jobType: "Ceiling Fan Installation",
            description: "Need to replace an old light fixture with a new ceiling fan in the master bedroom. Already purchased the fan (Hunter brand, 52 inch). Have existing electrical box.",
            urgency: "Flexible",
            status: "booked",
            aiReply: "Hi Robert! Thanks for the Thumbtack request. Great that you already have the fan — Hunter makes excellent products. If the existing electrical box is fan-rated, this should be a straightforward install. I can come out Saturday morning. Does 9 AM work for you? The job typically takes about 1-2 hours.",
            createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        },
    ];
}

// GET — Fetch all leads
export async function GET() {
    return NextResponse.json({ leads: global.__hustleai_leads });
}

// POST — Add a new lead
export async function POST(request) {
    try {
        const body = await request.json();

        const lead = {
            id: `lead_${Date.now()}`,
            source: body.source || "Manual",
            customerName: body.customerName || "Unknown",
            customerPhone: body.customerPhone || "",
            customerEmail: body.customerEmail || null,
            jobType: body.jobType || "General",
            description: body.description || "",
            urgency: body.urgency || "Flexible",
            status: "new",
            aiReply: null,
            createdAt: new Date().toISOString(),
        };

        global.__hustleai_leads.unshift(lead);

        return NextResponse.json({ success: true, lead });
    } catch (err) {
        console.error("[Lead Ingest] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — Update lead status
export async function PATCH(request) {
    try {
        const { id, status, aiReply } = await request.json();
        const lead = global.__hustleai_leads.find((l) => l.id === id);

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        if (status) lead.status = status;
        if (aiReply) lead.aiReply = aiReply;

        return NextResponse.json({ success: true, lead });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
