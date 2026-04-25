import { NextResponse } from "next/server";
import { requireRole } from "@/server/middlewares/auth";
import { readJsonBody } from "@/server/utils/read-json";
import { listUsers, updateUserTrustScore } from "@/server/services/identity/auth";
import { requestTakedown } from "@/services/similarity/engine";
import { SimilarityPlatform } from "@/lib/types";
import { analyzeBehavior } from "@/services/behavior";

export async function handleAdminUsers(request: Request) {
  const auth = requireRole(request, ["admin", "enterprise"]);
  if (auth.error) return auth.error;

  const users = listUsers().map((user) => ({
    ...user,
    behavior: analyzeBehavior(user)
  }));
  return NextResponse.json({ users });
}

export async function handleAdminTakedown(request: Request) {
  const auth = requireRole(request, ["moderator", "admin", "enterprise"]);
  if (auth.error) return auth.error;

  const parsed = await readJsonBody<{ contentId?: string; hash?: string; platform?: SimilarityPlatform; userId?: string }>(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data!;

  if (!body.contentId || !body.hash || !body.platform) {
    return NextResponse.json({ error: "Missing takedown payload." }, { status: 400 });
  }

  const result = await requestTakedown({
    matchId: body.contentId,
    hash: body.hash,
    platform: body.platform
  });

  if (body.userId) {
    updateUserTrustScore({
      userId: body.userId,
      suspiciousBehavior: true,
      truthDelta: -4,
      contentHash: body.hash
    });
  }

  return NextResponse.json({ ok: true, ...result });
}
