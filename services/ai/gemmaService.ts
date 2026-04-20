import { timedProvider, clamp, heuristicSignals, normalizePreview, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function gemmaService(context: ProviderContext) {
  return timedProvider("gemma", async () => {
    const preview = normalizePreview(context.preview);
    const signals = heuristicSignals(preview);
    const score = clamp(74 - signals.length * 10 - (preview.length < 90 ? 6 : 0), 14, 95);

    return {
      live: false,
      result: {
        provider: "gemma",
        model: "gemma-factcheck-sim",
        role: "Fact-checking and contextual understanding",
        verdict: verdictFromScore(score),
        truthScore: score,
        confidence: 77,
        summary:
          score < 45
            ? "Fact-check context is weak, source support is missing, and the claim shape resembles known misinformation formats."
            : "Context analysis found partial grounding, but more source evidence would raise confidence.",
        signals: signals.length ? signals : ["contextual evidence remains limited"],
        weight: 1.2
      }
    };
  });
}
