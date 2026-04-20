import { NextResponse } from "next/server";
import { verifyContent } from "@/lib/verification-service";
import { AnalysisInput } from "@/lib/types";
import { requirePlatformAccess } from "@/lib/platform";
import { validateAnalysisInput } from "@/lib/validation";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const access = requirePlatformAccess(request);
  if (access.error) return access.error;

  const parsed = await readJsonBody<AnalysisInput>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  const error = validateAnalysisInput(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const record = await verifyContent(body);
  return NextResponse.json({
    message: "This result is based on multiple AI systems.",
    record
  });
}
