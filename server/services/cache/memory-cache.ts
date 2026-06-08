import { VerificationRecord } from "@/lib/types";

const verificationCache = new Map<string, { record: VerificationRecord; expiresAt: number }>();
const inFlight = new Map<string, Promise<VerificationRecord>>();
const ttlMs = 5 * 60 * 1000;

export function getCachedVerification(hash: string) {
  const hit = verificationCache.get(hash);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    verificationCache.delete(hash);
    return null;
  }
  return hit.record;
}

export function setCachedVerification(hash: string, record: VerificationRecord) {
  verificationCache.set(hash, { record, expiresAt: Date.now() + ttlMs });
}

export async function useInFlightVerification(hash: string, runner: () => Promise<VerificationRecord>) {
  const current = inFlight.get(hash);
  if (current) return current;

  const task = runner().finally(() => {
    inFlight.delete(hash);
  });
  inFlight.set(hash, task);
  return task;
}
