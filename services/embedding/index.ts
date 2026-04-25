import { generateEmbedding } from "@/lib/embeddings";

const embeddingCache = new Map<string, number[]>();

async function fromCache(key: string, producer: () => Promise<number[]>) {
  const existing = embeddingCache.get(key);
  if (existing) return existing;
  const next = await producer();
  embeddingCache.set(key, next);
  return next;
}

export async function generateTextEmbedding(text: string, demoMode = false) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return fromCache(`text:${normalized}`, () => generateEmbedding(normalized, demoMode));
}

export async function generateImageEmbedding(image: string, demoMode = false) {
  const normalized = image.slice(0, 400);
  return fromCache(`image:${normalized}`, () => generateEmbedding(normalized, demoMode));
}
