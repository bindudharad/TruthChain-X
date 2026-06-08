import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";
import { toggleProfileBookmark } from "@/server/services/profile-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const result = await toggleProfileBookmark(auth.principal.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        storageAvailable: false,
        error: error instanceof Error ? error.message : "Unable to update bookmark."
      },
      { status: 400 }
    );
  }
}
