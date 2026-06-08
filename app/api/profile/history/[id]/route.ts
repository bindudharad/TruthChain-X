import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";
import { getProfileHistoryDetail } from "@/server/services/profile-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const detail = await getProfileHistoryDetail(auth.principal.id, id);
    if (!detail) {
      return NextResponse.json({ error: "History item not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load analysis detail." }, { status: 400 });
  }
}
