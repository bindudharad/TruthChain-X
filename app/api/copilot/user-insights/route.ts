import { NextResponse } from "next/server";
import { getCopilotUserInsights } from "@/services/copilot/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash") || undefined;
  const userInsights = await getCopilotUserInsights({ hash });
  return NextResponse.json({ userInsights, updatedAt: new Date().toISOString() });
}
