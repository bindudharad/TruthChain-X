import { NextResponse } from "next/server";
import { buildDashboardSnapshot } from "@/server/services/dashboard/summary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash") || undefined;
  const snapshot = await buildDashboardSnapshot(hash);

  if (!snapshot) {
    return NextResponse.json({ error: "No dashboard records found." }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
