import { NextResponse } from "next/server";
import { listVerifications } from "@/lib/db";

export async function GET() {
  const records = await listVerifications();
  const feed = records.slice(0, 10).map((record, index) => ({
    id: `${record.id}-feed`,
    label: record.fileName,
    score: record.truthScore,
    timestamp: record.timestamp,
    status: record.truthScore < 40 ? "high-risk" : record.truthScore < 70 ? "watch" : "trusted",
    channel: ["social", "news", "messaging", "community"][index % 4]
  }));

  return NextResponse.json({ feed });
}
