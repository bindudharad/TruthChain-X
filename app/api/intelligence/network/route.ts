import { NextResponse } from "next/server";
import { getGlobalIntelligenceSnapshot } from "@/services/intelligence/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash") || undefined;
  const snapshot = await getGlobalIntelligenceSnapshot({ hash });

  return NextResponse.json(snapshot.network);
}
