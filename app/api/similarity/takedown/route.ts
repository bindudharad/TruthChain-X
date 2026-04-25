import { NextResponse } from "next/server";
import { requestTakedown } from "@/services/similarity/engine";
import { readJsonBody } from "@/server/utils/read-json";
import { SimilarityPlatform } from "@/lib/types";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ contentId?: string; hash?: string; platform?: SimilarityPlatform }>(request);
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

  return NextResponse.json(result);
}
