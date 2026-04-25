import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createJwt, verifyJwt } from "@/lib/platform";
import { ApiPlan, PlatformRole } from "@/lib/types";

type RefreshSession = {
  id: string;
  userId: string;
  tokenHash: string;
  role: PlatformRole;
  plan: ApiPlan;
  name: string;
  expiresAt: number;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const refreshFile = join(dataDir, "refresh-sessions.json");

function ensureFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(refreshFile)) writeFileSync(refreshFile, "[]", "utf8");
}

function readSessions() {
  ensureFile();
  return JSON.parse(readFileSync(refreshFile, "utf8")) as RefreshSession[];
}

function writeSessions(sessions: RefreshSession[]) {
  ensureFile();
  writeFileSync(refreshFile, JSON.stringify(sessions, null, 2), "utf8");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function issueSessionTokens({
  userId,
  role,
  plan,
  name
}: {
  userId: string;
  role: PlatformRole;
  plan: ApiPlan;
  name: string;
}) {
  const accessToken = createJwt({ sub: userId, role, plan, name }, 60 * 60 * 4);
  const refreshToken = createJwt({ sub: userId, role, plan, name }, 60 * 60 * 24 * 7);
  const sessions = readSessions();
  sessions.unshift({
    id: randomUUID(),
    userId,
    tokenHash: tokenHash(refreshToken),
    role,
    plan,
    name,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: new Date().toISOString()
  });
  writeSessions(sessions.slice(0, 500));
  return { accessToken, refreshToken };
}

export function refreshAccessToken(refreshToken: string) {
  const payload = verifyJwt(refreshToken);
  if (!payload) return null;
  const sessions = readSessions();
  const session = sessions.find((item) => item.tokenHash === tokenHash(refreshToken) && item.expiresAt > Date.now());
  if (!session) return null;

  return createJwt({
    sub: payload.sub,
    role: payload.role,
    plan: payload.plan,
    name: payload.name
  }, 60 * 60 * 4);
}

export function revokeRefreshToken(refreshToken: string) {
  const sessions = readSessions();
  const next = sessions.filter((item) => item.tokenHash !== tokenHash(refreshToken));
  writeSessions(next);
}
