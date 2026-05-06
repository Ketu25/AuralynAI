import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const base = process.env.DATABASE_URL ?? "";
  // pgbouncer in transaction mode (Supabase default) can't handle multiple
  // connections per serverless instance. Inject connection_limit=1 so each
  // container holds exactly one connection; pgbouncer owns the pool.
  const url =
    base && !base.includes("connection_limit")
      ? `${base}${base.includes("?") ? "&" : "?"}connection_limit=1`
      : base;
  return new PrismaClient({ datasources: { db: { url } } });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
// Always persist on globalThis — guards against module re-evaluation in dev
// hot-reload AND any serverless runtime that reuses the process across invocations.
globalForPrisma.prisma = prisma;
