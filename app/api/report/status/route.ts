import { NextResponse } from "next/server";
import { getReportStatuses } from "@/services/reporting/orchestrator";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";

export async function GET(request: Request) {
  const limited = applyRouteRateLimit(request, "report-status", 60);
  if (limited) return limited;

  const reports = await getReportStatuses();
  return NextResponse.json({ reports });
}
