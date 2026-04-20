import { NextResponse } from "next/server";
import { verifyContent } from "@/lib/verification-service";
import { AnalysisInput } from "@/lib/types";
import { requirePlatformAccess } from "@/lib/platform";
import { validateAnalysisInput } from "@/lib/validation";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const access = requirePlatformAccess(request, { minimumPlan: "pro" });
  if (access.error) return access.error;

  const parsed = await readJsonBody<{ items?: AnalysisInput[] }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  const items = body.items || [];

  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "Missing items array." }, { status: 400 });
  }

  if (items.length > 10) {
    return NextResponse.json({ error: "Bulk verify currently supports up to 10 items per request." }, { status: 400 });
  }

  for (const item of items) {
    const itemError = validateAnalysisInput(item);
    if (itemError) {
      return NextResponse.json({ error: itemError }, { status: 400 });
    }
  }

  const results = await Promise.all(
    items.map((item) =>
      verifyContent({
        ...item,
        creatorId: item.creatorId || access.principal?.id || "bulk-client",
        creatorName: item.creatorName || access.principal?.name || "Bulk Client"
      })
    )
  );

  return NextResponse.json({
    processed: results.length,
    results: results.map((record) => ({
      hash: record.hash,
      truthScore: record.truthScore,
      confidence: record.confidence,
      fingerprint: record.trustFingerprint,
      transactionHash: record.transactionHash
    }))
  });
}
