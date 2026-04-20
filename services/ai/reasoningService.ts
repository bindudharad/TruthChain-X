import { timedProvider, callOpenAiCompatibleChat, clamp, heuristicSignals, normalizePreview, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function reasoningService(context: ProviderContext) {
  return timedProvider("openrouter", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b";
    const preview = normalizePreview(context.preview);
    const riskBias = heuristicSignals(preview).length * 9 + (context.input.type === "video" ? 6 : 0);
    const score = clamp(76 - riskBias, 12, 95);
    const summary =
      score < 40
        ? "Deep reasoning sees coordinated manipulation cues, weak provenance, and a pattern that resembles high-spread misinformation."
        : score < 70
          ? "Deep reasoning found unresolved evidence gaps, so the content remains in a caution state."
          : "Deep reasoning found limited manipulation evidence, though provenance checks still matter.";

    if (apiKey && !context.input.demoMode) {
      try {
        const content = await callOpenAiCompatibleChat(
          "https://openrouter.ai/api/v1",
          apiKey,
          model,
          "You are an expert misinformation reasoning system. Explain likely authenticity risk in one concise paragraph.",
          `${context.input.type.toUpperCase()} submission: ${preview}`
        );

        return {
          live: true,
          result: {
            provider: "openrouter",
            model,
            role: "Deep reasoning and explanation",
            verdict: verdictFromScore(score),
            truthScore: score,
            confidence: 82,
            summary: content || summary,
            signals: heuristicSignals(preview),
            weight: 1.35
          }
        };
      } catch {
        // Demo fallback below.
      }
    }

    return {
      live: false,
      result: {
        provider: "openrouter",
        model: "demo-gpt-oss",
        role: "Deep reasoning and explanation",
        verdict: verdictFromScore(score),
        truthScore: score,
        confidence: 80,
        summary,
        signals: heuristicSignals(preview),
        weight: 1.35
      }
    };
  });
}
