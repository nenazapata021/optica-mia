import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrisma() {
    try {
        const { PrismaPg } = require("@prisma/adapter-pg");
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        return new PrismaClient({
            adapter,
            log:
                process.env.NODE_ENV === "development"
                    ? ["query", "error", "warn"]
                    : ["error"],
        });
    } catch {
        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["error"] : [],
        });
    }
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;