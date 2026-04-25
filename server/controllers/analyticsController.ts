import { NextResponse } from "next/server";
import { buildAnalyticsReport } from "@/lib/analytics";
import { listCreatorProfiles, listVerifications } from "@/lib/db";
import { listUsageSnapshots, requirePlatformAccess } from "@/lib/platform";

export async function handleAnalyticsReport(request: Request) {
  const access = requirePlatformAccess(request, { minimumPlan: "enterprise" });
  if (access.error) return access.error;

  const [records, creators] = await Promise.all([listVerifications(), listCreatorProfiles()]);
  const usage = listUsageSnapshots();
  const report = buildAnalyticsReport(records, creators, usage);

  return NextResponse.json(report);
}
