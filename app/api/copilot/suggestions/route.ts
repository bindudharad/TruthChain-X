import { NextResponse } from "next/server";
import { getCopilotSuggestions } from "@/services/copilot/engine";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ hash?: string; demoMode?: boolean }>(request);
  if (parsed.error) return parsed.error;

  const suggestions = await getCopilotSuggestions(parsed.data || {});
  return NextResponse.json({ suggestions });
}
