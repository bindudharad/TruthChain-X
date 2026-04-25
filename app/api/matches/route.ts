import { NextResponse } from "next/server";
import { getRecentMatches } from "@/services/search/similarityEngine";

export async function GET() {
  const matches = await getRecentMatches();
  return NextResponse.json({ matches });
}
