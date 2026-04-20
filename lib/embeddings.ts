import { createHash } from "crypto";

function normalizeVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / magnitude);
}

function fallbackEmbedding(content: string) {
  const digest = createHash("sha256").update(content).digest();
  const values = Array.from({ length: 24 }, (_, index) => {
    const byte = digest[index % digest.length];
    return (byte / 255) * 2 - 1;
  });
  return normalizeVector(values);
}

export async function generateEmbedding(content: string, demoMode = false) {
  if (demoMode || !process.env.NEMOTRON_API_KEY) {
    return fallbackEmbedding(content);
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEMOTRON_API_KEY}`
      },
      body: JSON.stringify({
        input: content.slice(0, 3000),
        model: process.env.NEMOTRON_MODEL || "nvidia/nv-embedqa-e5-v5"
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    const embedding = data.data?.[0]?.embedding;
    return embedding?.length ? normalizeVector(embedding) : fallbackEmbedding(content);
  } catch {
    return fallbackEmbedding(content);
  }
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0)) || 1;
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0)) || 1;
  return dot / (magA * magB);
}
