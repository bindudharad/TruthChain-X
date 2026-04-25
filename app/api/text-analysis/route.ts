import { analyzeTextContent } from "@/lib/universal-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; input?: string };
    const text = body.text || body.input || "";
    if (!text.trim()) {
      return Response.json({ error: "Text input is required." }, { status: 400 });
    }

    const result = await analyzeTextContent(text);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Text analysis failed." },
      { status: 500 }
    );
  }
}
