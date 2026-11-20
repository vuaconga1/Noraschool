import { prisma } from "@/lib/prisma";

let cached: { ok: boolean; checkedAt: number } | null = null;
const TTL_SUCCESS_MS = 30_000;
const TTL_ERROR_MS = 2_000;
const DB_TIMEOUT_MS = 10_000;

export function hasPlaceholderDbCreds(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.trim()) return true;
  if (/USER:PASSWORD/i.test(url)) return true;
  if (/ep-xxx/i.test(url) || url.includes("USER:PASSWORD@")) return true;
  return false;
}

export async function isDbConfigured(): Promise<boolean> {
  if (hasPlaceholderDbCreds()) return false;
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function probeOnce(): Promise<boolean> {
  await Promise.race([
    prisma.$queryRaw`SELECT 1`,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB_PROBE_TIMEOUT")), DB_TIMEOUT_MS),
    ),
  ]);
  return true;
}

export async function canUsePrisma(): Promise<boolean> {
  if (!(await isDbConfigured())) return false;
  const now = Date.now();
  if (cached) {
    const ttl = cached.ok ? TTL_SUCCESS_MS : TTL_ERROR_MS;
    if (now - cached.checkedAt < ttl) return cached.ok;
  }

  try {
    await probeOnce();
    cached = { ok: true, checkedAt: now };
    return true;
  } catch {
    try {
      await probeOnce();
      cached = { ok: true, checkedAt: Date.now() };
      return true;
    } catch {
      cached = { ok: false, checkedAt: now };
      return false;
    }
  }
}

export function resetDbProbeCache(): void {
  cached = null;
}
