import { runVisualSearch } from "@/lib/visual-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      imageUrl?: string;
      imageData?: string;
      page?: number;
      pageSize?: number;
    };

    const result = await runVisualSearch(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Visual search failed." },
      { status: 400 }
    );
  }
}
