import { NextResponse } from "next/server";
import { AnalysisInput, ContentType } from "@/lib/types";
import { getCachedAnalysis } from "@/server/services/trust-analysis/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeInput(searchParams: URLSearchParams): AnalysisInput {
  const type = (searchParams.get("type") || "text") as ContentType;
  const value = searchParams.get("input") || "";

  return {
    type,
    content: value,
    url: type === "url" ? value : undefined,
    imageUrl: type === "image" && /^https?:\/\//i.test(value) ? value : undefined,
    videoUrl: type === "video" ? value : undefined,
    fileName: searchParams.get("fileName") || undefined,
    creatorId: searchParams.get("creatorId") || undefined,
    creatorName: searchParams.get("creatorName") || undefined
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = normalizeInput(searchParams);

    if (!input.content.trim()) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }

    const cached = await getCachedAnalysis(input);
    if (!cached) {
      return NextResponse.json({ found: false, cached: false, result: null });
    }

    return NextResponse.json({ found: true, cached: true, result: cached });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load cached analysis." },
      { status: 400 }
    );
  }
}
