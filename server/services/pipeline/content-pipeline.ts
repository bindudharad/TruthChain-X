import { randomUUID } from "crypto";
import { runAnalysis } from "@/lib/analysis";
import { findVerificationByHash, listVerifications, saveVerification } from "@/lib/db";
import { cosineSimilarity, generateEmbedding } from "@/lib/embeddings";
import { hashContent } from "@/lib/hashing";
import { AnalysisInput, VerificationRecord } from "@/lib/types";
import { setCachedVerification, useInFlightVerification } from "@/server/services/cache/memory-cache";
import { storeFingerprint } from "@/server/services/blockchain/registry";
import { applyReputationUpdate } from "@/server/services/identity/reputation";
import { logError, logInfo } from "@/server/utils/logger";

export async function processContentAnalysis(input: AnalysisInput): Promise<VerificationRecord> {
  const hash = hashContent(`${input.type}:${input.content}`);
  return useInFlightVerification(hash, async () => {
    try {
      const creatorId = input.creatorId || "creator_demo";
      const creatorName = input.creatorName || "Demo Creator";
      const existing = await findVerificationByHash(hash);

      if (existing) {
        const nextCreator = await applyReputationUpdate({
          creatorId,
          creatorName,
          hash,
          truthScore: existing.truthScore,
          fileName: existing.fileName,
          confirmedIdentity: existing.blockchainStatus === "confirmed"
        });

        const merged = await saveVerification({
          ...existing,
          creatorId,
          creatorProfile: nextCreator
        });
        setCachedVerification(hash, merged);
        return merged;
      }

      const history = await listVerifications();
      const embedding = await generateEmbedding(input.content, input.demoMode);
      const similarMatches = history.filter((record) => (record.embedding ? cosineSimilarity(embedding, record.embedding) > 0.88 : false)).length;
      const result = await runAnalysis(input, history);
      const timestamp = Date.now();
      const chain = await storeFingerprint(hash, result.truthScore, Math.floor(timestamp / 1000));
      const nextCreator = await applyReputationUpdate({
        creatorId,
        creatorName,
        hash,
        truthScore: result.truthScore,
        fileName: input.fileName || `${input.type}-submission`,
        confirmedIdentity: chain.status === "confirmed"
      });

      const record = await saveVerification({
        id: randomUUID(),
        hash,
        type: input.type,
        fileName: input.fileName || `${input.type}-submission`,
        creatorId,
        creatorProfile: nextCreator,
        embedding,
        truthScore: result.truthScore,
        confidence: result.confidence,
        executiveSummary: result.executiveSummary,
        explanation: result.explanation,
        findings: result.findings,
        suspiciousSignals: result.suspiciousSignals,
        detectedClaims: result.detectedClaims,
        modelBreakdown: result.modelBreakdown,
        preprocessing: result.preprocessing,
        consensus: result.consensus,
        trustFingerprint: {
          ...result.trustFingerprint,
          similarMatches
        },
        trustGraph: result.trustGraph,
        viralSignal: result.viralSignal,
        comparisonVisuals: result.comparisonVisuals,
        timestamp: new Date(timestamp).toISOString(),
        firstVerifiedAt: new Date(timestamp).toISOString(),
        lastVerifiedAt: new Date(timestamp).toISOString(),
        occurrenceCount: 1,
        previouslyVerified: false,
        blockchainStatus: chain.status,
        transactionHash: chain.transactionHash,
        sourcePreview: input.content.slice(0, 200)
      });

      setCachedVerification(hash, record);
      logInfo("Content analysis completed", { hash, creatorId, truthScore: record.truthScore });
      return record;
    } catch (error) {
      logError("Content pipeline failed", error, { type: input.type, fileName: input.fileName });
      throw error;
    }
  });
}
