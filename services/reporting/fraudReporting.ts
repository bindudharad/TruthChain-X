import { SimilarityPlatform } from "@/lib/types";
import { createFraudReport, listReportingEvents } from "@/services/index/contentIndex";

export async function logFraudReport({
  matchId,
  hash,
  reason,
  platform
}: {
  matchId: string;
  hash: string;
  reason: string;
  platform: SimilarityPlatform;
}) {
  const report = await createFraudReport({
    matchId,
    hash,
    reason,
    action: "report",
    platform
  });
  const reports = await listReportingEvents();
  return {
    report,
    totalReports: reports.filter((item) => item.matchId === matchId).length,
    statusMessage: `Fraud report logged for ${platform}.`
  };
}

export async function logTakedownRequest({
  matchId,
  hash,
  platform
}: {
  matchId: string;
  hash: string;
  platform: SimilarityPlatform;
}) {
  const report = await createFraudReport({
    matchId,
    hash,
    reason: "Simulated takedown request sent to the source platform.",
    action: "takedown",
    platform
  });

  return {
    request: report,
    status: "pending" as const,
    statusMessage: `Report sent to ${platform}. Takedown request is pending review.`
  };
}
