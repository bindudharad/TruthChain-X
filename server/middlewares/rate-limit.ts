import { NextResponse } from "next/server";

const windows = new Map<string, { count: number; resetAt: number }>();

export function applyRouteRateLimit(request: Request, key: string, limit = 60, windowMs = 60_000) {
  const identity = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "local";
  const bucketKey = `${key}:${identity}`;
  const current = windows.get(bucketKey);
  const now = Date.now();

  if (!current || current.resetAt < now) {
    windows.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return NextResponse.json({ error: "Rate limit exceeded for this route.", retryAfterMs: current.resetAt - now }, { status: 429 });
  }

  current.count += 1;
  windows.set(bucketKey, current);
  return null;
}
