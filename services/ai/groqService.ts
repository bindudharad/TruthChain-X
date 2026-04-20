import { timedProvider, callOpenAiCompatibleChat, clamp, heuristicSignals, normalizePreview, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function groqService(context: ProviderContext) {
  return timedProvider("groq", async () => {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const preview = normalizePreview(context.preview);
    const signals = heuristicSignals(preview);
    const fallbackScore = clamp(80 - signals.length * 11 - (context.input.type === "video" ? 4 : 0), 18, 95);

    if (apiKey && !context.input.demoMode) {
      try {
        const content = await callOpenAiCompatibleChat(
          "https://api.groq.com/openai/v1",
          apiKey,
          model,
          "You are a rapid misinformation triage model. Return a single plain sentence summary and initial risk impression.",
          `${context.input.type.toUpperCase()} submission: ${preview}`
        );

        return {
          live: true,
          result: {
            provider: "groq",
            model,
            role: "Fast triage and summarization",
            verdict: verdictFromScore(fallbackScore),
            truthScore: fallbackScore,
            confidence: 71,
            summary: content || "Rapid triage completed for this submission.",
            signals: signals.length ? signals : ["no strong rapid-response flags"],
            weight: 1.05
          }
        };
      } catch {
        // Demo fallback below.
      }
    }

    return {
      live: false,
      result: {
        provider: "groq",
        model: "demo-groq-fastlane",
        role: "Fast triage and summarization",
        verdict: verdictFromScore(fallbackScore),
        truthScore: fallbackScore,
        confidence: 69,
        summary:
          fallbackScore < 45
            ? "Rapid triage flags this submission as high-risk and worth deeper review."
            : "Rapid triage found mixed or limited signals and handed the content to deeper models.",
        signals: signals.length ? signals : ["no strong rapid-response flags"],
        weight: 1.05
      }
    };
  });
}
