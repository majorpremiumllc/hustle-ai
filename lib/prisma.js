import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

async function createTursoAdapter() {
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client/web");

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error("TURSO_DATABASE_URL is not set");
    }

    const libsql = createClient({ url, authToken });
    return new PrismaLibSql(libsql);
}

function createPrismaClient() {
    // For production with Turso, we need to handle async adapter creation
    // But PrismaClient needs sync initialization, so we use a proxy
    if (process.env.TURSO_DATABASE_URL) {
        // Use libsql/client/web for serverless compatibility
        const { createClient } = require("@libsql/client/web");
        const { PrismaLibSql } = require("@prisma/adapter-libsql");

        const url = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        const libsql = createClient({ url, authToken });
        const adapter = new PrismaLibSql(libsql);
        return new PrismaClient({ adapter });
    }

    // Fallback to default SQLite for local development
    return new PrismaClient();
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
