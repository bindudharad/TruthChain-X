import { NextResponse } from "next/server";
import { AnalysisInput } from "@/lib/types";
import { buildWeightedSummary } from "@/services/ensemble";
import { validateAnalyzeRequest } from "@/server/middlewares/validate-request";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { processContentAnalysis } from "@/server/services/pipeline/content-pipeline";
import { readJsonBody } from "@/server/utils/read-json";

export async function handleAnalyze(request: Request) {
  const limited = applyRouteRateLimit(request, "analyze", 50);
  if (limited) return limited;

  const parsed = await readJsonBody<
    | (AnalysisInput & { contentType?: "text" | "image"; demoMode?: boolean })
    | { contentType: "text" | "image"; content: string; fileName?: string; demoMode?: boolean }
  >(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data as
    | (AnalysisInput & { contentType?: "text" | "image"; demoMode?: boolean })
    | { contentType: "text" | "image"; content: string; fileName?: string; demoMode?: boolean };
  const requestBody = body as Partial<AnalysisInput> & { contentType?: "text" | "image"; demoMode?: boolean; fileName?: string; content?: string };

  const normalized: AnalysisInput = {
    type: requestBody.type || requestBody.contentType || "text",
    content: requestBody.content || "",
    fileName: requestBody.fileName,
    demoMode: requestBody.demoMode,
    creatorId: requestBody.creatorId,
    creatorName: requestBody.creatorName
  };

  const error = validateAnalyzeRequest(normalized);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const record = await processContentAnalysis(normalized);
  const summary = buildWeightedSummary(record.modelBreakdown, record.trustFingerprint.similarMatches, record.explanation);

  return NextResponse.json({
    ...summary,
    txHash: record.transactionHash,
    blockchainStatus: record.blockchainStatus,
    hash: record.hash,
    fingerprintId: record.trustFingerprint.fingerprintId,
    creator: record.creatorProfile,
    record
  });
}
