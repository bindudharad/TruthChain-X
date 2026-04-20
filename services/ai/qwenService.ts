import { timedProvider, clamp, heuristicSignals, normalizePreview, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function qwenService(context: ProviderContext) {
  return timedProvider("qwen", async () => {
    const preview = normalizePreview(context.preview);
    const technical = /source code|exploit|firmware|protocol|schema|python|solidity|smart contract/i.test(preview);
    const score = technical ? clamp(72 - heuristicSignals(preview).length * 6, 24, 92) : 70;

    return {
      live: false,
      result: {
        provider: "qwen",
        model: technical ? "qwen-coder-technical-review" : "qwen-coder-standby",
        role: "Technical-content analysis",
        verdict: verdictFromScore(score),
        truthScore: score,
        confidence: technical ? 73 : 45,
        summary: technical
          ? "Technical analysis reviewed whether the claim references code or protocol details in a misleading way."
          : "Technical analysis was deprioritized because the content does not look primarily code-based.",
        signals: technical ? ["technical-claim review enabled"] : ["technical review skipped"],
        weight: technical ? 0.85 : 0.2
      }
    };
  });
}
