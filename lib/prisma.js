import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
    // If TURSO_DATABASE_URL is set, use the libSQL adapter (cloud Turso)
    if (process.env.TURSO_DATABASE_URL) {
        const libsql = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        const adapter = new PrismaLibSQL(libsql);
        return new PrismaClient({ adapter });
    }

    // Fallback to default SQLite for local development
    return new PrismaClient();
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
