import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __truthchainPrisma: PrismaClient | undefined;
}

function buildClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

export function hasSqlDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  if (!hasSqlDatabase()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__truthchainPrisma) {
    global.__truthchainPrisma = buildClient();
  }

  return global.__truthchainPrisma;
}
