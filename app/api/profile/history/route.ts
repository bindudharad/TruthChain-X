import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";
import { getProfileHistoryList, getTrendingInsights } from "@/server/services/profile-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const data = await getProfileHistoryList(auth.principal.id, {
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      verdict: searchParams.get("verdict") || undefined,
      bookmarked: searchParams.get("bookmarked") === "true" ? true : undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined
    });
    const trending = await getTrendingInsights(auth.principal.id);

    return NextResponse.json({
      history: data.items,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      storageAvailable: data.storageAvailable,
      trending: trending.items
    });
  } catch (error) {
    return NextResponse.json(
      {
        history: [],
        total: 0,
        page: 1,
        pageSize: 10,
        storageAvailable: false,
        error: error instanceof Error ? error.message : "Unable to load profile history."
      },
      { status: 200 }
    );
  }
}
