import { NextResponse } from "next/server";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { applyReputationUpdate, getUserProfile } from "@/server/services/identity/reputation";
import { readJsonBody } from "@/server/utils/read-json";

export async function handleUserLookup(request: Request, userId: string) {
  const limited = applyRouteRateLimit(request, "user-lookup", 120);
  if (limited) return limited;

  const profile = await getUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ id: userId, found: false, message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ id: userId, found: true, user: profile });
}

export async function handleUserScoreUpdate(request: Request) {
  const limited = applyRouteRateLimit(request, "user-score-update", 45);
  if (limited) return limited;

  const parsed = await readJsonBody<{
    creatorId?: string;
    creatorName?: string;
    hash?: string;
    truthScore?: number;
    fileName?: string;
    confirmedIdentity?: boolean;
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

  return NextResponse.json({ updated: true, user: profile });
}
