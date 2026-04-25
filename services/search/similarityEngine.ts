import { SimilarityPlatform } from "@/lib/types";
import { listRecentSimilarityMatches, reportFraudulentContent, requestTakedown, searchSimilarContent } from "@/services/similarity/engine";

export async function runSimilaritySearch(input: Parameters<typeof searchSimilarContent>[0]) {
  const data = await searchSimilarContent(input);
  return {
    queryHash: data.queryHash,
    platforms: data.platforms,
    matches: data.results
  };
}

export async function getRecentMatches(limit = 12) {
  return listRecentSimilarityMatches(limit);
}

export async function fileFraudReport({
  matchId,
  hash,
  reason,
  action,
  platform
}: {
  matchId: string;
  hash: string;
  reason: string;
  action: "report" | "takedown";
  platform: SimilarityPlatform;
}) {
  return action === "takedown"
    ? requestTakedown({ matchId, hash, platform })
    : reportFraudulentContent({ matchId, hash, reason, platform });
}
