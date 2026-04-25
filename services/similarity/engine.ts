import { hashContent } from "@/lib/hashing";
import { SimilarityMatch, SimilarityPlatform } from "@/lib/types";
import { cosineSimilarity } from "@/lib/embeddings";
import { listIndexedContent, listReportingEvents } from "@/services/index/contentIndex";
import { generateImageEmbedding, generateTextEmbedding } from "@/services/embedding";
import { logFraudReport, logTakedownRequest } from "@/services/reporting/fraudReporting";

type SimilaritySearchInput = {
  type: "text" | "image" | "video";
  content: string;
  currentHash?: string;
  demoMode?: boolean;
  limit?: number;
};

export async function cosineSimilarityScore(vec1: number[], vec2: number[]) {
  return cosineSimilarity(vec1, vec2);
}

export async function searchSimilarContent(input: SimilaritySearchInput) {
  const currentHash = input.currentHash || hashContent(`${input.type}:${input.content}`);
  const embedding =
    input.type === "image" ? await generateImageEmbedding(input.content, input.demoMode) : await generateTextEmbedding(input.content, input.demoMode);
  const entries = await listIndexedContent();
  const reports = await listReportingEvents();

  const rankedResults: SimilarityMatch[] = entries
    .filter((entry) => entry.hash !== currentHash)
    .map((entry) => {
      const score = Math.round(cosineSimilarityScoreSync(embedding, entry.embedding) * 100);
      const reportCount = reports.filter((item) => item.matchId === entry.id).length || entry.reportCount;
      return {
        matchId: entry.id,
        similarityScore: score,
        matchedContent: entry.content,
        preview: entry.preview,
        source: entry.source,
        url: entry.url,
        caption: entry.caption,
        trustScore: Math.max(4, entry.trustScore - Math.min(reportCount * 3, 15)),
        platforms: entry.platforms,
        reportCount,
        severity: score > 85 ? "high" : score > 65 ? "medium" : entry.severity
      };
    })
    .sort((left, right) => right.similarityScore - left.similarityScore);

  const thresholdResults = rankedResults.filter((entry) => entry.similarityScore >= 28);
  const results = (thresholdResults.length ? thresholdResults : rankedResults.slice(0, Math.min(input.limit || 10, 4))).slice(0, input.limit || 10);

  return {
    queryHash: currentHash,
    platforms: Array.from(new Set(results.flatMap((item) => item.platforms))),
    results
  };
}

function cosineSimilarityScoreSync(vec1: number[], vec2: number[]) {
  return cosineSimilarity(vec1, vec2);
}

export async function listRecentSimilarityMatches(limit = 12) {
  const entries = await listIndexedContent();
  return entries
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit)
    .map((entry) => ({
      matchId: entry.id,
      similarityScore: 100,
      matchedContent: entry.content,
      preview: entry.preview,
      source: entry.source,
      url: entry.url,
      caption: entry.caption,
      trustScore: entry.trustScore,
      platforms: entry.platforms,
      reportCount: entry.reportCount,
      severity: entry.severity
    }));
}

export async function reportFraudulentContent({
  matchId,
  hash,
  reason,
  platform
}: {
  matchId: string;
  hash: string;
  reason: string;
  platform: SimilarityPlatform;
}) {
  return logFraudReport({ matchId, hash, reason, platform });
}

export async function requestTakedown({
  matchId,
  hash,
  platform
}: {
  matchId: string;
  hash: string;
  platform: SimilarityPlatform;
}) {
  return logTakedownRequest({ matchId, hash, platform });
}
