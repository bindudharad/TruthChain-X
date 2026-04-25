import { NextResponse } from "next/server";
import { createBulkReports } from "@/services/reporting/orchestrator";
import { readJsonBody } from "@/server/utils/read-json";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { ReportDispatchMode } from "@/lib/types";

export async function POST(request: Request) {
  const limited = applyRouteRateLimit(request, "report-bulk", 20);
  if (limited) return limited;

  const parsed = await readJsonBody<{ contentIds?: string[]; userId?: string; mode?: ReportDispatchMode }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!Array.isArray(body.contentIds) || !body.contentIds.length) {
    return NextResponse.json({ error: "Select at least one content item." }, { status: 400 });
  }

  if (body.contentIds.length > 10) {
    return NextResponse.json({ error: "Batch size exceeds the safe limit of 10 items." }, { status: 400 });
  }

  const result = await createBulkReports({
    contentIds: body.contentIds,
    userId: body.userId || "moderator-demo",
    mode: body.mode || "link"
  });

  return NextResponse.json(result);
}
