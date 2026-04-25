import { NextResponse } from "next/server";
import { reportFraudulentContent } from "@/services/similarity/engine";
import { readJsonBody } from "@/server/utils/read-json";
import { SimilarityPlatform } from "@/lib/types";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ contentId?: string; hash?: string; reason?: string; userId?: string; platform?: SimilarityPlatform }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.contentId || !body.hash || !body.reason || !body.platform) {
    return NextResponse.json({ error: "Missing report payload." }, { status: 400 });
  }

  const result = await reportFraudulentContent({
    matchId: body.contentId,
    hash: body.hash,
    reason: body.reason,
    platform: body.platform
  });

  return NextResponse.json(result);
}
