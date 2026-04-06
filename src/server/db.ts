import { PrismaClient } from "@prisma/client";

declare global {
  var __foodOptimizerPrisma: PrismaClient | undefined;
}

export function getDb(): PrismaClient {
  if (globalThis.__foodOptimizerPrisma) {
    return globalThis.__foodOptimizerPrisma;
  }

  const prisma = new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__foodOptimizerPrisma = prisma;
  }

  return prisma;
}
