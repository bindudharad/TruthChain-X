import { analyzeUrlContent } from "@/lib/universal-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; input?: string };
    const url = body.url || body.input || "";
    if (!url.trim()) {
      return Response.json({ error: "URL is required." }, { status: 400 });
    }

    const result = await analyzeUrlContent(url);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "URL analysis failed." },
      { status: 500 }
    );
  }
}
