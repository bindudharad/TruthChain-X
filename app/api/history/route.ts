import { NextResponse } from "next/server";
import { buildTrendingAlerts, listVerifications } from "@/lib/db";

export async function GET() {
  const records = await listVerifications();
  return NextResponse.json({
    records,
    trendingAlerts: buildTrendingAlerts(records)
  });
}
