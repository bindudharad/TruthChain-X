import { NextResponse } from "next/server";
import { fileFraudReport } from "@/services/search/similarityEngine";
import { readJsonBody } from "@/server/utils/read-json";
import { SimilarityPlatform } from "@/lib/types";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{
    contentId?: string;
    matchId?: string;
    hash?: string;
    reason?: string;
    userId?: string;
    action?: "report" | "takedown";
    platform?: SimilarityPlatform;
  }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  const matchId = body.matchId || body.contentId;
  const hash = body.hash || matchId;
  const action = body.action || "report";
  const platform = body.platform || "TruthChain";

  if (!matchId || !hash || !body.reason) {
    return NextResponse.json({ error: "Missing report payload." }, { status: 400 });
  }

  const result = await fileFraudReport({
    matchId,
    hash,
    reason: body.reason,
    action,
    platform
  });

  return NextResponse.json(result);
}
