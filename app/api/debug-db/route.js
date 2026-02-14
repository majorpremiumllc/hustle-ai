export async function GET() {
    try {
        const hasTursoUrl = !!process.env.TURSO_DATABASE_URL;
        const hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;
        const tursoUrlPrefix = process.env.TURSO_DATABASE_URL?.substring(0, 30) || "NOT SET";
        const dbUrl = process.env.DATABASE_URL?.substring(0, 20) || "NOT SET";

        // Try importing and connecting
        let dbStatus = "not tested";
        try {
            const prisma = (await import("@/lib/prisma")).default;
            const count = await prisma.user.count();
            dbStatus = `connected, ${count} users`;
        } catch (e) {
            dbStatus = `error: ${e.message}`;
        }

        return Response.json({
            hasTursoUrl,
            hasTursoToken,
            tursoUrlPrefix,
            dbUrl,
            dbStatus,
            nodeEnv: process.env.NODE_ENV,
        });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
