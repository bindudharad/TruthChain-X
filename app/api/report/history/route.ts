import { NextResponse } from "next/server";
import { getReportHistory } from "@/services/reporting/orchestrator";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";

export async function GET(request: Request) {
  const limited = applyRouteRateLimit(request, "report-history", 60);
  if (limited) return limited;

  const history = await getReportHistory();
  return NextResponse.json(history);
}
