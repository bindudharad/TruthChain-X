import { analyzeInput } from "@/server/services/trust-analysis/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; input?: string };
    const url = body.url || body.input || "";
    if (!url.trim()) {
      return Response.json({ error: "URL is required." }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL." }, { status: 400 });
    }

    const result = await analyzeInput({
      type: "url",
      content: url,
      url,
      fileName: "url-analysis.txt",
      creatorId: "url-analysis",
      creatorName: "TruthChain-X URL Analysis"
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "URL analysis failed." },
      { status: 500 }
    );
  }
}
