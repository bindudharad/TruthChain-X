import { runImageSearch } from "@/lib/image-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageUrl?: string; imageData?: string };
    const result = await runImageSearch(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reverse image search failed." },
      { status: 500 }
    );
  }
}
