import { NextResponse } from "next/server";
import { runSimilaritySearch } from "@/services/search/similarityEngine";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ type?: "text" | "image" | "video"; content?: string; currentHash?: string }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.type || !body.content) {
    return NextResponse.json({ error: "Missing type or content." }, { status: 400 });
  }

  const results = await runSimilaritySearch({
    type: body.type,
    content: body.content,
    currentHash: body.currentHash,
    demoMode: true,
    limit: 1
  });
  const top = results.matches[0];

  return NextResponse.json({
    similarityScore: top?.similarityScore || 0,
    modified: (top?.similarityScore || 0) >= 45 && (top?.similarityScore || 0) < 100,
    exactMatch: (top?.similarityScore || 0) === 100,
    baseline: {
      fileName: top?.caption || "No related content found."
    }
  });
}
