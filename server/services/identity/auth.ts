import { createHash, randomBytes } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { hash, compare } from "bcryptjs";
import { ApiPlan, PlatformRole, UserAccount, UserBadge, UserTrustPassport } from "@/lib/types";

const dataDir = join(process.cwd(), "data");
const usersFile = join(dataDir, "users.json");

function ensureUsersFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(usersFile)) writeFileSync(usersFile, "[]", "utf8");
}

function readUsers() {
  ensureUsersFile();
  return JSON.parse(readFileSync(usersFile, "utf8")) as UserAccount[];
}

function writeUsers(users: UserAccount[]) {
  ensureUsersFile();
  writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeUserId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "user_demo";
}

function badgesFromPassport(passport: Pick<UserTrustPassport, "verificationStatus" | "trustScore" | "reportsAccuracy">): UserBadge[] {
  const badges: UserBadge[] = [];
  if (passport.verificationStatus === "verified") badges.push("Verified");
  if (passport.reportsAccuracy >= 72) badges.push("Trusted Reporter");
  if (passport.trustScore >= 82) badges.push("High Credibility");
  return badges;
}

export function computePermissions(role: PlatformRole, trustScore: number, plan: ApiPlan) {
  const permissions = new Set<string>(["view:dashboard", "view:passport", "create:report"]);
  if (trustScore >= 40) permissions.add("create:upload");
  if (trustScore >= 55) permissions.add("create:similarity-search");
  if (role === "moderator" || role === "admin" || role === "enterprise") permissions.add("review:alerts");
  if (role === "admin" || role === "enterprise") permissions.add("manage:users");
  if (role === "enterprise") permissions.add("view:enterprise");
  if (plan === "pro" || plan === "enterprise" || plan === "internal") permissions.add("view:intelligence");
  return [...permissions];
}

function riskLevelFromScore(score: number): UserTrustPassport["riskLevel"] {
  if (score < 40) return "high";
  if (score < 70) return "medium";
  return "low";
}

function blockchainIdentityHash(userId: string, email: string) {
  return createHash("sha256").update(`${userId}:${email}`).digest("hex");
}

export function sanitizeUser(user: UserAccount): UserTrustPassport {
  const { passwordHash, passwordSalt, behaviorFlags, ...rest } = user;
  return rest;
}

export function listUsers() {
  return readUsers().map(sanitizeUser);
}

export function findUserByEmail(email: string) {
  return readUsers().find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(userId: string) {
  return readUsers().find((user) => user.userId === normalizeUserId(userId)) || null;
}

export function getTrustUserProfile(userId: string) {
  const user = findUserById(userId);
  return user ? sanitizeUser(user) : null;
}

export async function createPasswordRecord(password: string) {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = await hash(`${password}:${salt}`, 10);
  return { passwordHash, passwordSalt: salt };
}

export async function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  return compare(`${password}:${passwordSalt}`, passwordHash);
}

export async function registerUser({
  email,
  password,
  displayName,
  role = "user",
  plan = "free"
}: {
  email: string;
  password: string;
  displayName: string;
  role?: PlatformRole;
  plan?: ApiPlan;
}) {
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }

  const userId = normalizeUserId(email.split("@")[0] || displayName);
  const passwordRecord = await createPasswordRecord(password);
  const now = new Date().toISOString();
  const base: UserAccount = {
    userId,
    email,
    displayName,
    role,
    plan,
    trustScore: 62,
    riskLevel: "medium",
    reportsCount: 0,
    contentHistory: [],
    verificationStatus: "pending",
    badges: [],
    reportsAccuracy: 50,
    permissions: [],
    uploadRestricted: false,
    blockchainIdentityHash: blockchainIdentityHash(userId, email),
    createdAt: now,
    lastLoginAt: now,
    behaviorFlags: [],
    ...passwordRecord
  };

  const next: UserAccount = {
    ...base,
    permissions: computePermissions(role, base.trustScore, plan),
    badges: badgesFromPassport(base),
    uploadRestricted: base.trustScore < 40
  };

  writeUsers([next, ...users].slice(0, 500));
  return sanitizeUser(next);
}

export async function loginUser(email: string, password: string) {
  const users = readUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
    throw new Error("Invalid email or password.");
  }

  const nextUser: UserAccount = {
    ...user,
    lastLoginAt: new Date().toISOString()
  };

  writeUsers(users.map((item) => (item.userId === nextUser.userId ? nextUser : item)));
  return sanitizeUser(nextUser);
}

export function updateUserTrustScore({
  userId,
  truthDelta = 0,
  reportsDelta = 0,
  accurateReport = false,
  suspiciousBehavior = false,
  contentHash
}: {
  userId: string;
  truthDelta?: number;
  reportsDelta?: number;
  accurateReport?: boolean;
  suspiciousBehavior?: boolean;
  contentHash?: string;
}) {
  const users = readUsers();
  const normalizedUserId = normalizeUserId(userId);
  const existing = users.find((user) => user.userId === normalizedUserId);
  if (!existing) return null;

  const trustScore = clamp(
    existing.trustScore + truthDelta + reportsDelta + (accurateReport ? 4 : 0) - (suspiciousBehavior ? 10 : 0),
    8,
    99
  );
  const reportsAccuracy = clamp(existing.reportsAccuracy + (accurateReport ? 6 : reportsDelta < 0 ? -4 : 0), 5, 99);
  const verificationStatus: UserTrustPassport["verificationStatus"] =
    existing.verificationStatus === "verified" || trustScore >= 74 ? "verified" : trustScore >= 52 ? "pending" : "unverified";
  const behaviorFlags = suspiciousBehavior
    ? ["spam-activity-watch", ...existing.behaviorFlags.filter((item) => item !== "spam-activity-watch")].slice(0, 8)
    : existing.behaviorFlags;

  const next: UserAccount = {
    ...existing,
    trustScore,
    riskLevel: riskLevelFromScore(trustScore),
    reportsCount: clamp(existing.reportsCount + reportsDelta, 0, 999),
    reportsAccuracy,
    verificationStatus,
    badges: badgesFromPassport({ verificationStatus, trustScore, reportsAccuracy }),
    permissions: computePermissions(existing.role, trustScore, existing.plan),
    uploadRestricted: trustScore < 40,
    contentHistory: contentHash ? [contentHash, ...existing.contentHistory.filter((item) => item !== contentHash)].slice(0, 12) : existing.contentHistory,
    behaviorFlags
  };

  writeUsers(users.map((user) => (user.userId === normalizedUserId ? next : user)));
  return sanitizeUser(next);
}
