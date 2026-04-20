import { AnalysisInput, ModelContribution, ModelVerdict, VerificationRecord } from "@/lib/types";

export type ProviderContext = {
  input: AnalysisInput;
  preview: string;
  history: VerificationRecord[];
};

export type ProviderResult = Omit<ModelContribution, "latencyMs" | "usedLiveApi">;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function verdictFromScore(score: number): ModelVerdict {
  if (score < 40) return "fake";
  if (score < 70) return "uncertain";
  return "real";
}

export function normalizePreview(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function heuristicSignals(value: string) {
  const normalized = value.toLowerCase();
  const signals: string[] = [];
  if (/breaking|share|urgent|deleted|miracle|guaranteed/.test(normalized)) signals.push("viral framing detected");
  if (/deepfake|mismatch|artifact|synthetic|blur|warp|glitch/.test(normalized)) signals.push("synthetic media cues present");
  if (/100%|all viruses|always|never/.test(normalized)) signals.push("absolute certainty without nuance");
  if (/campaign|speech|interview|celebrity|selfie|portrait/.test(normalized)) signals.push("high-risk impersonation domain");
  return signals;
}

export async function timedProvider(
  provider: ModelContribution["provider"],
  runner: () => Promise<{ result: ProviderResult; live: boolean }>
): Promise<ModelContribution> {
  const start = Date.now();
  const response = await runner();
  return {
    ...response.result,
    provider,
    latencyMs: Date.now() - start,
    usedLiveApi: response.live
  };
}

export async function callOpenAiCompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  user: string
) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Chat provider failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export function tokenSimilarity(a: string, b: string) {
  const tokensA = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  return Math.round((intersection / union) * 100);
}
