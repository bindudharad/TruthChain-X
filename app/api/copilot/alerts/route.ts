import { NextResponse } from "next/server";
import { getCopilotAlerts } from "@/services/copilot/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash") || undefined;
  const alerts = await getCopilotAlerts({ hash });
  return NextResponse.json({ alerts, updatedAt: new Date().toISOString() });
}
