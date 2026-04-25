import { NextResponse } from "next/server";
import { listRecentSimilarityMatches } from "@/services/similarity/engine";

export async function GET() {
  const matches = await listRecentSimilarityMatches(16);
  return NextResponse.json({ matches });
}
