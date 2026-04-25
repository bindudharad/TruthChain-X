import { NextResponse } from "next/server";
import { runSimilaritySearch } from "@/services/search/similarityEngine";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ type?: "text" | "image" | "video"; content?: string; currentHash?: string; demoMode?: boolean }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.type || !body.content) {
    return NextResponse.json({ error: "Missing type or content." }, { status: 400 });
  }

  const data = await runSimilaritySearch({
    type: body.type,
    content: body.content,
    currentHash: body.currentHash,
    demoMode: body.demoMode,
    limit: 8
  });

  return NextResponse.json(data);
}
