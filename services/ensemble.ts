import { ModelContribution } from "@/lib/types";

type SourceScores = {
  groq: number;
  hf: number;
  gpt: number;
};

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function levelFromScore(score: number, inverted = false) {
  const value = inverted ? 100 - score : score;
  if (value < 34) return "low" as const;
  if (value < 68) return "medium" as const;
  return "high" as const;
}

export function buildWeightedSummary(models: ModelContribution[], similarMatches: number, explanation: string) {
  const groq = models.find((item) => item.provider === "groq")?.truthScore ?? 50;
  const hf = models.find((item) => item.provider === "huggingface")?.truthScore ?? groq;
  const gpt = models.find((item) => item.provider === "openrouter")?.truthScore ?? average(models.map((item) => item.truthScore));
  const score = Math.round(groq * 0.3 + hf * 0.3 + gpt * 0.4);
  const confidence = average(models.map((item) => item.confidence));
  const consensus = average(models.map((item) => item.truthScore));

  return {
    score,
    risk: levelFromScore(score, true),
    credibility: levelFromScore(score),
    consensus,
    matches: similarMatches,
    confidence,
    explanation,
    sources: { groq, hf, gpt } satisfies SourceScores
  };
}
