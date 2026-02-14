export async function GET() {
    try {
        const url = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // Test 1: Direct createClient
        let test1 = "not run";
        try {
            const { createClient } = require("@libsql/client/web");
            const libsql = createClient({ url, authToken });
            const result = await libsql.execute("SELECT COUNT(*) as cnt FROM User");
            test1 = `success: ${JSON.stringify(result.rows)}`;
        } catch (e) {
            test1 = `error: ${e.message}`;
        }

        // Test 2: Prisma with inline adapter
        let test2 = "not run";
        try {
            const { PrismaClient } = require("@prisma/client");
            const { PrismaLibSql } = require("@prisma/adapter-libsql");
            const { createClient: createClient2 } = require("@libsql/client/web");

            const libsql2 = createClient2({ url, authToken });
            const adapter = new PrismaLibSql(libsql2);
            const p = new PrismaClient({ adapter });
            const count = await p.user.count();
            test2 = `success: ${count} users`;
            await p.$disconnect();
        } catch (e) {
            test2 = `error: ${e.message}`;
        }

        // Test 3: Import default prisma 
        let test3 = "not run";
        try {
            const prisma = (await import("@/lib/prisma")).default;
            const count = await prisma.user.count();
            test3 = `success: ${count} users`;
        } catch (e) {
            test3 = `error: ${e.message}`;
        }

        return Response.json({
            url: url?.substring(0, 35),
            authToken: authToken ? "present" : "missing",
            test1_direct: test1,
            test2_inline_prisma: test2,
            test3_lib_prisma: test3,
        });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
