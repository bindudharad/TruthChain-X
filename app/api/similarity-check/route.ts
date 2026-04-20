import { NextResponse } from "next/server";
import { listVerifications } from "@/lib/db";
import { tokenSimilarityPercent } from "@/utils/similarity";
import { hashContent } from "@/lib/hashing";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ type?: "text" | "image" | "video"; content?: string; currentHash?: string }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.type || !body.content) {
    return NextResponse.json({ error: "Missing type or content." }, { status: 400 });
  }

  const currentHash = body.currentHash || hashContent(`${body.type}:${body.content}`);
  const records = await listVerifications();
  const matches = records
    .filter((record) => record.hash !== currentHash)
    .map((record) => ({
      hash: record.hash,
      fileName: record.fileName,
      similarity: tokenSimilarityPercent(body.content!, record.sourcePreview)
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const top = matches[0] || { hash: "", fileName: "No related content found.", similarity: 0 };

  return NextResponse.json({
    similarityScore: top.similarity,
    modified: top.similarity >= 45 && top.similarity < 100,
    exactMatch: top.similarity === 100,
    baseline: top
  });
}
