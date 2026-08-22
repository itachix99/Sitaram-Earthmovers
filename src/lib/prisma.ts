import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

// Touch env so a bad DATABASE_URL fails fast at boot.
void env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
