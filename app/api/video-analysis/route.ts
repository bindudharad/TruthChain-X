import { analyzeInput } from "@/server/services/trust-analysis/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; videoUrl?: string; input?: string };
    const url = body.videoUrl || body.url || body.input || "";
    if (!url.trim()) {
      return Response.json({ error: "Video URL is required." }, { status: 400 });
    }

    const result = await analyzeInput({
      type: "video",
      content: url,
      videoUrl: url,
      url,
      fileName: "video-analysis.txt",
      creatorId: "video-analysis",
      creatorName: "TruthChain-X Video Analysis"
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Video analysis failed." },
      { status: 500 }
    );
  }
}
