import { NextResponse } from "next/server";
import { checkOnce } from "@/lib/email-listener";

export const dynamic = 'force-dynamic';

// Optional: Security token to prevent unauthorized pinging
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
    try {
        // Validate cron secret if defined in env
        if (CRON_SECRET) {
            const authHeader = request.headers.get("authorization");
            if (authHeader !== `Bearer ${CRON_SECRET}`) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        console.log("[Email Cron] Triggering IMAP check...");

        // This connects, checks for UNSEEN emails, processes them, and disconnects after 5s.
        const result = await checkOnce();

        if (!result) {
            return NextResponse.json({ status: "skipped", message: "GMAIL_APP_PASSWORD not set" });
        }

        return NextResponse.json({ status: "success", message: "IMAP check completed successfully" });
    } catch (error) {
        console.error("[Email Cron] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
