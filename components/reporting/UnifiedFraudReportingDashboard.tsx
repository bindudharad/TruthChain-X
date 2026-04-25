"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, ExternalLink, FileWarning, ShieldAlert } from "lucide-react";
import { MatchList } from "@/components/reporting/MatchList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClientDateText } from "@/components/ui/ClientDateText";
import { api } from "@/services/api";
import {
  BulkReportResult,
  FraudReportRecord,
  ReportDispatchMode,
  ReportingAuditLogEntry,
  SimilarityMatch
} from "@/lib/types";

type HistoryResponse = {
  reports: FraudReportRecord[];
  audit: ReportingAuditLogEntry[];
};

type StatusResponse = {
  reports: FraudReportRecord[];
};

type BulkResponse = {
  results: BulkReportResult[];
  selectedCount: number;
  mode: ReportDispatchMode;
};

function buildExplanation(match: SimilarityMatch) {
  const reasons = [
    `Similarity is ${match.similarityScore}%, which indicates repeated or lightly modified reuse.`,
    `Trust score is ${match.trustScore}%, so the content already sits in a risky confidence range.`,
    `${match.reportCount} prior reports suggest recurring concern from moderators or users.`
  ];

  return {
    simple:
      match.similarityScore >= 85
        ? "This looks like the same misleading content appearing again on another platform."
        : "This looks like a modified version of an already suspicious post.",
    reasons
  };
}

export function UnifiedFraudReportingDashboard({
  initialMatches,
  initialReports,
  initialAudit
}: {
  initialMatches: SimilarityMatch[];
  initialReports: FraudReportRecord[];
  initialAudit: ReportingAuditLogEntry[];
}) {
  const [matches] = useState(initialMatches);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMatch, setActiveMatch] = useState<SimilarityMatch | null>(initialMatches[0] || null);
  const [mode, setMode] = useState<ReportDispatchMode>("link");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [reports, setReports] = useState(initialReports);
  const [audit, setAudit] = useState(initialAudit);
  const [lastDispatch, setLastDispatch] = useState<BulkReportResult[]>([]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const [statusData, historyData] = await Promise.all([
          api.get<StatusResponse>("/api/report/status"),
          api.get<HistoryResponse>("/api/report/history")
        ]);
        setReports(statusData.reports || []);
        setAudit(historyData.audit || []);
      } catch {
        return;
      }
    }, 20000);

    return () => window.clearInterval(timer);
  }, []);

  const selectedMatches = useMemo(() => matches.filter((match) => selectedIds.includes(match.matchId)), [matches, selectedIds]);
  const explanation = useMemo(() => (activeMatch ? buildExplanation(activeMatch) : null), [activeMatch]);
  const recentStatuses = useMemo(() => reports.slice(0, 6), [reports]);
  const matchLookup = useMemo(() => new Map(matches.map((match) => [match.matchId, match])), [matches]);

  function toggleSelect(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelectedIds((current) => (current.length === matches.length ? [] : matches.map((match) => match.matchId)));
  }

  async function handleBulkReport() {
    if (!selectedIds.length) {
      setStatusMessage("Select at least one item before reporting.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<BulkResponse>("/api/report/bulk", {
        contentIds: selectedIds,
        userId: "moderator-demo",
        mode
      });
      setLastDispatch(response.results || []);
      setStatusMessage(`Prepared ${response.selectedCount} report${response.selectedCount === 1 ? "" : "s"} using ${response.mode.toUpperCase()} mode.`);

      const [statusData, historyData] = await Promise.all([
        api.get<StatusResponse>("/api/report/status"),
        api.get<HistoryResponse>("/api/report/history")
      ]);
      setReports(statusData.reports || []);
      setAudit(historyData.audit || []);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Bulk reporting failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <Card className="panel-subtle p-5" hover={false}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected Matches</p>
          <p className="mt-3 text-3xl font-semibold text-white">{matches.length}</p>
          <p className="mt-2 text-sm text-slate-400">Cross-platform items available for moderation.</p>
        </Card>
        <Card className="panel-subtle p-5" hover={false}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected Batch</p>
          <p className="mt-3 text-3xl font-semibold text-white">{selectedIds.length}</p>
          <p className="mt-2 text-sm text-slate-400">Safe batch limit is 10 items per dispatch.</p>
        </Card>
        <Card className="panel-subtle p-5" hover={false}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reporting Queue</p>
          <p className="mt-3 text-3xl font-semibold text-white">{reports.filter((report) => report.status !== "reviewed").length}</p>
          <p className="mt-2 text-sm text-slate-400">Pending or sent reports still in the lifecycle.</p>
        </Card>
        <Card className="panel-subtle p-5" hover={false}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Audit Events</p>
          <p className="mt-3 text-3xl font-semibold text-white">{audit.length}</p>
          <p className="mt-2 text-sm text-slate-400">Tracked reporting actions with timestamps.</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">UFRO</p>
              <p className="mt-2 text-2xl font-semibold text-white">Unified Fraud Reporting Orchestrator</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Review similar content, select affected items in bulk, generate structured evidence, and safely dispatch moderation actions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as ReportDispatchMode)}
                className="h-11 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none"
              >
                <option value="link">Link Mode</option>
                <option value="demo">Demo Mode</option>
                <option value="api">API Mode</option>
              </select>
              <Button onClick={handleBulkReport} disabled={loading || !selectedIds.length}>
                <ClipboardCheck size={16} />
                {loading ? "Preparing..." : "Report Selected"}
              </Button>
            </div>
          </div>

          {statusMessage ? <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{statusMessage}</div> : null}

          <MatchList
            matches={matches}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
            activeId={activeMatch?.matchId}
            onActivate={setActiveMatch}
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-100">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">AI Explanation Panel</p>
                <p className="text-sm text-slate-400">Clear reasons for escalation on the active item.</p>
              </div>
            </div>

            {activeMatch && explanation ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Original Preview</p>
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-7 text-slate-300">
                    {activeMatch.preview}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{activeMatch.caption}</p>
                    <Badge tone={activeMatch.similarityScore > 85 ? "danger" : activeMatch.similarityScore > 65 ? "warning" : "info"}>
                      {activeMatch.similarityScore}%
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{explanation.simple}</p>
                </div>
                <div className="space-y-2">
                  {explanation.reasons.map((reason) => (
                    <div key={reason} className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
                      {reason}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Highlighted suspicious parts</p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{activeMatch.preview}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-10 text-center text-sm text-slate-400">
                Choose a match to inspect its moderation explanation.
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-100">
                <FileWarning size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Dispatch Results</p>
                <p className="text-sm text-slate-400">Latest reporting outcomes and next steps.</p>
              </div>
            </div>
            <div className="space-y-3">
              {lastDispatch.length ? (
                lastDispatch.map((item) => (
                  <div key={item.reportId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.platform}</p>
                        <p className="mt-1 text-sm text-slate-300">{item.reason}</p>
                      </div>
                      <Badge tone={item.status === "sent" ? "success" : item.status === "pending" ? "warning" : "info"}>{item.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.dispatch.message}</p>
                    {item.dispatch.reportingUrl ? (
                      <a
                        href={item.dispatch.reportingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-100 transition hover:text-white"
                      >
                        <ExternalLink size={14} />
                        Open reporting link
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
                  Run a bulk report to populate dispatch results.
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-200" />
            <div>
              <p className="text-lg font-semibold text-white">Report Status Tracking</p>
              <p className="text-sm text-slate-400">Lifecycle updates for recent moderation actions.</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentStatuses.length ? (
              recentStatuses.map((report) => (
                <div key={report.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{report.platform}</p>
                    <Badge tone={report.status === "reviewed" ? "success" : report.status === "sent" ? "info" : "warning"}>
                      {report.status || "pending"}
                    </Badge>
                  </div>
                  <div className="mt-3 max-h-28 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/30 p-3 text-sm leading-7 text-slate-300">
                    {matchLookup.get(report.matchId)?.preview || report.reason}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{report.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    <ClientDateText value={report.createdAt} mode="datetime" fallbackLabel={report.createdAt.replace("T", " ").slice(0, 16)} />
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
                No reporting events yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <p className="text-lg font-semibold text-white">Audit Log</p>
            <p className="text-sm text-slate-400">Tracked moderator actions, dispatch events, and reporting timestamps.</p>
          </div>
          <div className="space-y-3">
            {audit.length ? (
              audit.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-medium capitalize text-white">{entry.action.replaceAll("-", " ")}</p>
                    <p className="mt-1 text-sm text-slate-300">{entry.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">Content {entry.contentId}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">
                    <ClientDateText value={entry.timestamp} mode="time" fallbackLabel={entry.timestamp.replace("T", " ").slice(11, 16)} />
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
                Audit entries will appear after the first moderation action.
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
