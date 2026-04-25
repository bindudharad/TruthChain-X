import { NextResponse } from "next/server";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { requireAuth, requireRole } from "@/server/middlewares/auth";
import { applyReputationUpdate, getUserProfile } from "@/server/services/identity/reputation";
import { getTrustUserProfile, updateUserTrustScore } from "@/server/services/identity/auth";
import { readJsonBody } from "@/server/utils/read-json";

export async function handleUserLookup(request: Request, userId: string) {
  const limited = applyRouteRateLimit(request, "user-lookup", 120);
  if (limited) return limited;

  const profile = getTrustUserProfile(userId) || (await getUserProfile(userId));
  if (!profile) {
    return NextResponse.json({ id: userId, found: false, message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ id: userId, found: true, user: profile });
}

export async function handleProfileLookup(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const profile = getTrustUserProfile(auth.principal.id);
  if (!profile) {
    return NextResponse.json({ found: false, message: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ found: true, user: profile });
}

export async function handlePermissionsLookup(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const profile = getTrustUserProfile(auth.principal.id);
  if (!profile) {
    return NextResponse.json({ found: false, message: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    permissions: profile.permissions,
    uploadRestricted: profile.uploadRestricted,
    role: profile.role,
    trustScore: profile.trustScore
  });
}

export async function handleUserScoreUpdate(request: Request) {
  const limited = applyRouteRateLimit(request, "user-score-update", 45);
  if (limited) return limited;

  const auth = requireRole(request, ["moderator", "admin", "enterprise"]);
  if (auth.error) return auth.error;

  const parsed = await readJsonBody<{
    creatorId?: string;
    creatorName?: string;
    hash?: string;
    truthScore?: number;
    fileName?: string;
    confirmedIdentity?: boolean;
    reportsDelta?: number;
    suspiciousBehavior?: boolean;
    accurateReport?: boolean;
  }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;

  if (!body.creatorId || !body.hash || typeof body.truthScore !== "number") {
    return NextResponse.json({ error: "Missing creatorId, hash, or truthScore." }, { status: 400 });
  }

  const profile = await applyReputationUpdate({
    creatorId: body.creatorId,
    creatorName: body.creatorName || body.creatorId,
    hash: body.hash,
    truthScore: body.truthScore,
    fileName: body.fileName || "manual-update",
    confirmedIdentity: Boolean(body.confirmedIdentity)
  });

  const trustProfile = updateUserTrustScore({
    userId: body.creatorId,
    reportsDelta: body.reportsDelta || 0,
    suspiciousBehavior: Boolean(body.suspiciousBehavior),
    accurateReport: Boolean(body.accurateReport),
    contentHash: body.hash
  });

  return NextResponse.json({ updated: true, user: profile, trustProfile });
}
