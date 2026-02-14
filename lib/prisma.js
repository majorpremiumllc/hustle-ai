import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;

    if (tursoUrl) {
        // Dynamic require to avoid bundling issues
        const { PrismaLibSQL } = require("@prisma/adapter-libsql");
        const { createClient } = require("@libsql/client");

        const libsql = createClient({
            url: tursoUrl,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        const adapter = new PrismaLibSQL(libsql);
        return new PrismaClient({ adapter });
    }

    // Fallback to default SQLite for local development
    return new PrismaClient();
}

// Lazy initialization: only create PrismaClient on first use
let _prisma;
function getPrisma() {
    if (!_prisma) {
        _prisma = globalForPrisma.prisma ?? createPrismaClient();
        if (process.env.NODE_ENV !== "production") {
            globalForPrisma.prisma = _prisma;
        }
    }
    return _prisma;
}

// Create a proxy that lazily initializes PrismaClient on first property access
const prisma = new Proxy({}, {
    get(target, prop) {
        const client = getPrisma();
        const value = client[prop];
        if (typeof value === "function") {
            return value.bind(client);
        }
        return value;
    },
});

export default prisma;
