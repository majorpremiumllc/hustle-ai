import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;

    if (tursoUrl) {
        // Pass config directly to PrismaLibSQL (fixes "URL undefined" issue on Vercel)
        const { PrismaLibSQL } = require("@prisma/adapter-libsql");
        const adapter = new PrismaLibSQL({
            url: tursoUrl,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        return new PrismaClient({ adapter });
    }

    // Fallback to default SQLite for local development
    return new PrismaClient();
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
