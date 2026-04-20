import { NextResponse } from "next/server";
import { getCopilotInsights } from "@/services/copilot/engine";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ hash?: string; demoMode?: boolean }>(request);
  if (parsed.error) return parsed.error;

  const payload = await getCopilotInsights(parsed.data || {});
  return NextResponse.json(payload);
}
