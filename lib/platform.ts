import { createHmac, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { ApiKeyRecord, ApiPlan, AuthTokenPayload, PlatformPrincipal, PlatformRole, UsageSnapshot } from "@/lib/types";
import { hashContent } from "@/lib/hashing";

const dataDir = join(process.cwd(), "data");
const apiKeysFile = join(dataDir, "api-keys.json");
const usageFile = join(dataDir, "api-usage.json");
const minuteWindows = new Map<string, { count: number; resetAt: number }>();

const planConfig: Record<ApiPlan, { requestsPerMinute: number; monthlyQuota: number }> = {
  free: { requestsPerMinute: 30, monthlyQuota: 1000 },
  pro: { requestsPerMinute: 120, monthlyQuota: 10000 },
  enterprise: { requestsPerMinute: 600, monthlyQuota: 200000 },
  internal: { requestsPerMinute: 1200, monthlyQuota: 1000000 }
};

const planRank: Record<ApiPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
  internal: 3
};

function ensureFiles() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(apiKeysFile)) {
    const seeded = buildSeedApiKeys();
    writeFileSync(apiKeysFile, JSON.stringify(seeded, null, 2), "utf8");
  }
  if (!existsSync(usageFile)) {
    writeFileSync(usageFile, "[]", "utf8");
  }
}

function buildSeedApiKeys(): ApiKeyRecord[] {
  const now = new Date().toISOString();
  const rawKeys = [
    { label: "Free Demo Key", raw: process.env.DEMO_FREE_API_KEY || "tcx_free_demo_key", plan: "free" as const },
    { label: "Pro Demo Key", raw: process.env.DEMO_PRO_API_KEY || "tcx_pro_demo_key", plan: "pro" as const },
    { label: "Enterprise Demo Key", raw: process.env.DEMO_ENTERPRISE_API_KEY || "tcx_enterprise_demo_key", plan: "enterprise" as const }
  ];

  return rawKeys.map((item, index) => ({
    id: `key-${index + 1}`,
    label: item.label,
    keyHash: hashContent(item.raw),
    plan: item.plan,
    active: true,
    monthlyQuota: planConfig[item.plan].monthlyQuota,
    requestsUsed: 0,
    createdAt: now
  }));
}

function readApiKeys() {
  ensureFiles();
  return JSON.parse(readFileSync(apiKeysFile, "utf8")) as ApiKeyRecord[];
}

function writeApiKeys(keys: ApiKeyRecord[]) {
  ensureFiles();
  writeFileSync(apiKeysFile, JSON.stringify(keys, null, 2), "utf8");
}

function readUsage() {
  ensureFiles();
  return JSON.parse(readFileSync(usageFile, "utf8")) as UsageSnapshot[];
}

function writeUsage(entries: UsageSnapshot[]) {
  ensureFiles();
  writeFileSync(usageFile, JSON.stringify(entries.slice(0, 3000), null, 2), "utf8");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", process.env.JWT_SECRET || "truthchain-dev-secret").update(value).digest("base64url");
}

export function createJwt(payload: Omit<AuthTokenPayload, "exp">, expiresInSeconds = 60 * 60 * 12) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const tokenPayload = base64UrlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }));
  const signature = sign(`${header}.${tokenPayload}`);
  return `${header}.${tokenPayload}.${signature}`;
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = sign(`${header}.${payload}`);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  const parsed = JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

export function listApiKeys() {
  return readApiKeys();
}

export function listUsageSnapshots() {
  return readUsage();
}

export function resolveApiKey(rawKey: string) {
  const keys = readApiKeys();
  const record = keys.find((item) => item.keyHash === hashContent(rawKey) && item.active);
  return record || null;
}

export function trackUsage(principal: PlatformPrincipal, route: string, method: string) {
  const usage = readUsage();
  const timestamp = new Date().toISOString();
  usage.unshift({
    id: `${principal.id}-${Date.now()}`,
    principalId: principal.id,
    plan: principal.plan,
    route,
    method,
    timestamp
  });
  writeUsage(usage);
  console.info(`[TruthChain API] ${method} ${route} by ${principal.id} (${principal.plan}) at ${timestamp}`);

  if (principal.apiKeyId) {
    const keys = readApiKeys();
    const nextKeys = keys.map((key) =>
      key.id === principal.apiKeyId
        ? {
            ...key,
            requestsUsed: key.requestsUsed + 1,
            lastUsedAt: timestamp
          }
        : key
    );
    writeApiKeys(nextKeys);
  }
}

export function checkRateLimit(identifier: string, plan: ApiPlan) {
  const windowKey = `${identifier}:${plan}`;
  const current = minuteWindows.get(windowKey);
  const now = Date.now();
  const maxRequests = planConfig[plan].requestsPerMinute;

  if (!current || current.resetAt < now) {
    minuteWindows.set(windowKey, { count: 1, resetAt: now + 60_000 });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  minuteWindows.set(windowKey, current);
  return { ok: true, remaining: maxRequests - current.count };
}

export function planMeetsMinimum(current: ApiPlan, minimum: ApiPlan) {
  return planRank[current] >= planRank[minimum];
}

export function extractPrincipal(request: Request): PlatformPrincipal | null {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const resolved = resolveApiKey(apiKey);
    if (!resolved) return null;
    return {
      id: resolved.id,
      role: resolved.plan === "enterprise" ? "enterprise" : "user",
      plan: resolved.plan,
      name: resolved.label,
      source: "api-key",
      apiKeyId: resolved.id
    };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJwt(token);
    if (!payload) return null;
    return {
      id: payload.sub,
      role: payload.role,
      plan: payload.plan,
      name: payload.name,
      source: "jwt"
    };
  }

  if (process.env.PLATFORM_AUTH_OPTIONAL !== "false") {
    return {
      id: "guest-demo",
      role: "user",
      plan: "free",
      name: "Guest Demo",
      source: "guest"
    };
  }

  return null;
}

export function requirePlatformAccess(request: Request, options?: { minimumPlan?: ApiPlan }) {
  const principal = extractPrincipal(request);
  if (!principal) {
    return {
      error: NextResponse.json({ error: "Unauthorized. Provide x-api-key or Bearer token." }, { status: 401 })
    };
  }

  if (options?.minimumPlan && !planMeetsMinimum(principal.plan, options.minimumPlan)) {
    return {
      error: NextResponse.json(
        { error: `This endpoint requires the ${options.minimumPlan} plan or higher.` },
        { status: 403 }
      )
    };
  }

  const identifier = request.headers.get("x-forwarded-for") || principal.id;
  const limit = checkRateLimit(identifier, principal.plan);
  if (!limit.ok) {
    return {
      error: NextResponse.json(
        { error: "Rate limit exceeded.", retryAfterMs: limit.retryAfterMs || 0 },
        { status: 429 }
      )
    };
  }

  trackUsage(principal, new URL(request.url).pathname, request.method);
  return { principal };
}

export function createDemoPrincipal(role: PlatformRole = "enterprise", plan: ApiPlan = "enterprise") {
  return createJwt({
    sub: `${role}-demo-user`,
    role,
    plan,
    name: role === "enterprise" ? "Enterprise Demo Client" : "TruthChain Demo User"
  });
}
