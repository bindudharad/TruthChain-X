import { AnalysisInput, VerificationRecord } from "@/lib/types";

export async function verifyContent(input: AnalysisInput): Promise<VerificationRecord> {
  const { processContentAnalysis } = await import("@/server/services/pipeline/content-pipeline");
  return processContentAnalysis(input);
}
