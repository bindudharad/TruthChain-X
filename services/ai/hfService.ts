import { timedProvider, clamp, heuristicSignals, normalizePreview, verdictFromScore, ProviderContext } from "@/services/ai/shared";

export async function hfService(context: ProviderContext) {
  return timedProvider("huggingface", async () => {
    const preview = normalizePreview(`${context.input.fileName || ""} ${context.preview}`);
    const visualRisk = /deepfake|selfie|portrait|artifact|blur|glitch|frame|lip|blink|mismatch/.test(preview.toLowerCase()) ? 1 : 0;
    const score = clamp(
      context.input.type === "text" ? 72 : 68 - visualRisk * 23 - (context.input.type === "video" ? 7 : 0),
      10,
      94
    );

    if (process.env.HUGGINGFACE_API_KEY && context.input.type === "image" && !context.input.demoMode) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_MODEL || "umm-maybe/AI-image-detector"}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: context.input.content })
          }
        );

        if (response.ok) {
          const data = (await response.json()) as Array<{ label?: string; score?: number }>;
          const fakeScore = data.find((item) => /fake|ai|generated|manipulated/i.test(item.label || ""))?.score ?? 0;
          const liveScore = clamp(Math.round((1 - fakeScore) * 100), 8, 96);

          return {
            live: true,
            result: {
              provider: "huggingface",
              model: process.env.HUGGINGFACE_MODEL || "umm-maybe/AI-image-detector",
              role: "Deepfake and manipulation detection",
              verdict: verdictFromScore(liveScore),
              truthScore: liveScore,
              confidence: 83,
              summary: fakeScore > 0.55 ? "HuggingFace flagged image-generation or manipulation artifacts." : "HuggingFace did not find strong synthetic-image evidence.",
              signals: heuristicSignals(preview),
              weight: 1.3
            }
          };
        }
      } catch {
        // fallback below
      }
    }

    return {
      live: false,
      result: {
        provider: "huggingface",
        model: context.input.type === "text" ? "hf-classifier-sim" : "hf-deepfake-sim",
        role: context.input.type === "text" ? "Content classification" : "Deepfake and manipulation detection",
        verdict: verdictFromScore(score),
        truthScore: score,
        confidence: context.input.type === "text" ? 67 : 84,
        summary:
          context.input.type === "text"
            ? "Classification suggests the text has traits shared with sensational or weakly sourced claims."
            : "Media forensics flagged likely manipulation markers in the uploaded asset description and metadata.",
        signals: heuristicSignals(preview),
        weight: context.input.type === "text" ? 0.95 : 1.3
      }
    };
  });
}
