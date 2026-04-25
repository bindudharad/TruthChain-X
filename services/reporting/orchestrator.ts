import { BulkReportResult, FraudReportRecord, ReportDispatchMode, SimilarityMatch } from "@/lib/types";
import {
  createFraudReport,
  createReportingAuditEntry,
  listIndexedContent,
  listReportingAuditHistory,
  listReportingEvents,
  setReportingStatus
} from "@/services/index/contentIndex";
import { dispatchModerationReport } from "@/services/report-dispatch";
import { generateModerationReport } from "@/services/report-generator";

function toMatch(entry: Awaited<ReturnType<typeof listIndexedContent>>[number], reports: FraudReportRecord[]): SimilarityMatch {
  const reportCount = reports.filter((item) => item.matchId === entry.id).length || entry.reportCount;
  return {
    matchId: entry.id,
    similarityScore: 100,
    matchedContent: entry.content,
    preview: entry.preview,
    source: entry.source,
    url: entry.url,
    caption: entry.caption,
    trustScore: entry.trustScore,
    platforms: entry.platforms,
    reportCount,
    severity: reportCount > 4 ? "high" : reportCount > 1 ? "medium" : entry.severity
  };
}

export async function createBulkReports({
  contentIds,
  userId,
  mode = "link"
}: {
  contentIds: string[];
  userId: string;
  mode?: ReportDispatchMode;
}) {
  const uniqueIds = Array.from(new Set(contentIds)).slice(0, 10);
  const [entries, reports] = await Promise.all([listIndexedContent(), listReportingEvents()]);

  const selected = entries.filter((entry) => uniqueIds.includes(entry.id));
  const results: BulkReportResult[] = [];

  for (const entry of selected) {
    const match = toMatch(entry, reports);
    const draft = await generateModerationReport(match);
    const dispatch = await dispatchModerationReport({ platform: entry.source, mode });
    const record = await createFraudReport({
      matchId: entry.id,
      hash: entry.hash,
      userId,
      reason: draft.reason,
      explanation: draft.explanation,
      similarityScore: draft.similarityScore,
      trustScore: draft.trustScore,
      action: "report",
      platform: entry.source,
      status: dispatch.status === "ready" ? "pending" : dispatch.status,
      dispatchMode: dispatch.mode,
      reportingUrl: dispatch.reportingUrl
    });

    await createReportingAuditEntry({
      actorId: userId,
      action: "report-created",
      contentId: entry.id,
      detail: `${draft.reason} (${dispatch.mode} mode)`
    });

    if (dispatch.status !== "ready") {
      await createReportingAuditEntry({
        actorId: userId,
        action: "dispatch-sent",
        contentId: entry.id,
        detail: dispatch.message
      });
    }

    results.push({
      reportId: record.id,
      contentId: entry.id,
      platform: entry.source,
      status: record.status || "pending",
      reason: draft.reason,
      explanation: draft.explanation,
      dispatch
    });
  }

  return {
    results,
    selectedCount: selected.length,
    mode
  };
}

export async function getReportStatuses() {
  const reports = await listReportingEvents();
  return reports
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 50);
}

export async function getReportHistory() {
  const [reports, audit] = await Promise.all([listReportingEvents(), listReportingAuditHistory()]);
  return {
    reports: reports.slice().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 50),
    audit: audit.slice().sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 80)
  };
}

export async function markReportReviewed({ reportId, actorId }: { reportId: string; actorId: string }) {
  const updated = await setReportingStatus(reportId, "reviewed");
  if (updated) {
    await createReportingAuditEntry({
      actorId,
      action: "status-updated",
      contentId: updated.matchId,
      detail: `Report ${reportId} marked as reviewed.`
    });
  }
  return updated;
}
