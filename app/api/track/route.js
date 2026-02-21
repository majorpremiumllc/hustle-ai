import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();

        // Log to server console (will appear in Vercel logs)
        console.log("[Track]", JSON.stringify({
            event: body.event,
            data: body.data,
            url: body.url,
            ts: body.timestamp,
            ref: body.referrer,
        }));

        // TODO: Store in DB when needed
        // await prisma.analyticsEvent.create({ data: { ... } });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: true }); // Never fail tracking
    }
}
