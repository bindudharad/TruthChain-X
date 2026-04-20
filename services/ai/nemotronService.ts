import { timedProvider, clamp, normalizePreview, tokenSimilarity, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function nemotronService(context: ProviderContext) {
  return timedProvider("nemotron", async () => {
    const preview = normalizePreview(context.preview);
    const topSimilarity = context.history.length
      ? Math.max(...context.history.map((record) => tokenSimilarity(preview, record.sourcePreview)))
      : 0;
    const score = clamp(78 - Math.max(topSimilarity - 60, 0) / 3, 18, 95);

    return {
      live: false,
      result: {
        provider: "nemotron",
        model: "nemotron-embed-sim",
        role: "Embeddings and semantic similarity",
        verdict: verdictFromScore(score),
        truthScore: score,
        confidence: clamp(58 + Math.round(topSimilarity / 2), 60, 90),
        summary:
          topSimilarity > 70
            ? `Embedding similarity found a strong cluster match against prior content at ${topSimilarity}% similarity.`
            : "Embedding similarity did not find a strong existing cluster, so novelty remains relatively high.",
        signals: topSimilarity > 70 ? ["semantic cluster overlap with earlier submissions"] : ["low prior-cluster similarity"],
        weight: 1.15
      }
    };
  });
}
