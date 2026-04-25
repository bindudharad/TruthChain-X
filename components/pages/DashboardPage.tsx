"use client";

import { ReactNode, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Link2, Megaphone, ScanSearch } from "lucide-react";
import { HistoryTimeline } from "@/components/dashboard/HistoryTimeline";
import { RealtimeTrustFeed } from "@/components/dashboard/RealtimeTrustFeed";
import { WalletConnectButton } from "@/components/features/blockchain/WalletConnectButton";
import { PageHero } from "@/components/layout/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { ClientDateText } from "@/components/ui/ClientDateText";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";
import { DashboardSnapshot } from "@/lib/types";

function toneFromCategory(category?: string) {
  if (category === "Risk") return "danger" as const;
  if (category === "Suspicious") return "warning" as const;
  return "success" as const;
}

export function DashboardPage({ initialSnapshot }: { initialSnapshot?: DashboardSnapshot | null }) {
  return (
    <WorkspacePage title="Security Dashboard" subtitle="Live trust posture, latest scan, and real-time monitoring" initialSnapshot={initialSnapshot}>
      {({ result, feed, records, generatedAt, stats, storage }) => (
        <DashboardContent result={result} feed={feed} records={records} generatedAt={generatedAt} stats={stats} storage={storage} />
      )}
    </WorkspacePage>
  );
}

function DashboardContent({ result, feed, records, generatedAt, stats, storage }: {
  result: DashboardSnapshot["result"] | null;
  feed: DashboardSnapshot["feed"];
  records: DashboardSnapshot["records"];
  generatedAt: string;
  stats: DashboardSnapshot["stats"];
  storage: DashboardSnapshot["storage"];
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "safe" | "risky">("all");

  const latestRecord = result?.record ?? records[0] ?? null;
  const score = result?.score ?? 0;
  const category = result?.category ?? "Safe";
  const reason = result?.reason ?? "Run a scan to generate a live verdict.";
  const detailItems = result?.details ?? result?.claimVerification?.explanation ?? [];
  const tags = Array.from(new Set(result?.tags ?? result?.claimVerification?.tags ?? []));
  const sources = (result?.factCheck?.articles ?? result?.claimVerification?.trustedSources ?? []).slice(0, 4);

  const signalSummary = useMemo(
    () => ({
      links: result?.features?.hasSuspiciousLinks ? 1 : 0,
      keywords:
        (result?.features?.hasPhishingKeywords ? 1 : 0) +
        (result?.features?.hasUrgencyWords ? 1 : 0) +
        (result?.features?.hasCredentialBait ? 1 : 0),
      claims: result?.claimVerification?.claimDetected ? 1 : 0
    }),
    [result]
  );

  const smallStats = [
    { label: "Open Alerts", value: stats.totalAlerts },
    { label: "Recent Scans", value: stats.recentScans },
    { label: "Average Score", value: `${stats.averageScore}%` },
    {
      label: "Risky %",
      value: `${records.length ? Math.round((records.filter((record) => record.truthScore < 40).length / records.length) * 100) : 0}%`
    }
  ];
  const filteredRecords = records.filter((record) => {
    if (filter === "safe") return record.truthScore >= 70;
    if (filter === "risky") return record.truthScore < 70;
    return true;
  });
  const filteredFeed = feed.filter((item) => {
    if (filter === "safe") return item.status === "safe";
    if (filter === "risky") return item.status !== "safe";
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Command Center"
        title="Clean trust monitoring for fast, confident demos"
        description="See the current posture, inspect the latest scan, and follow the live stream of new verification activity without wading through duplicate panels."
        badges={[
          { label: storage.mode === "mongo" ? "MongoDB Live" : "Local JSON Live", tone: storage.mode === "mongo" ? "success" : "info" },
          { label: "Real-Time Monitoring", tone: "info" }
        ]}
        stats={[
          { label: "Current Verdict", value: category, detail: latestRecord?.fileName || "No active scan" },
          {
            label: "Last Sync",
            value: <ClientDateText value={generatedAt} mode="time" fallbackLabel={generatedAt?.slice(11, 16) || "--:--"} />,
            detail: "Latest dashboard refresh"
          }
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.04] p-1 text-sm">
          {(["all", "safe", "risky"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 capitalize transition ${
                filter === item ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <WalletConnectButton />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card hover={false} className="rounded-2xl bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Summary Card</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                <CountUp value={score} suffix="%" />
              </p>
              <div className="mt-3">
                <Badge tone={toneFromCategory(category)} className="text-sm">
                  {category}
                </Badge>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{reason}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
              {latestRecord?.fileName || "Awaiting live result"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SignalCard icon={<Link2 className="h-4 w-4" />} label="Links" value={signalSummary.links} />
            <SignalCard icon={<AlertTriangle className="h-4 w-4" />} label="Keywords" value={signalSummary.keywords} />
            <SignalCard icon={<Megaphone className="h-4 w-4" />} label="Claims" value={signalSummary.claims} />
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((current) => !current)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:scale-105 hover:bg-white/[0.08]"
          >
            View Details
            {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <div className={`grid transition-all duration-300 ease-out ${detailsOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-xl">
                {detailItems.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Explanation</p>
                    <div className="mt-3 space-y-2">
                      {detailItems.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tags.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tags</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge key={`${tag}-${index}`} tone={/risk|phishing|trusted source/i.test(tag) ? "warning" : "info"}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {sources.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sources</p>
                    <div className="mt-3 space-y-2">
                      {sources.map((source, index) => (
                        <div key={`${source.url}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                          <span className="font-medium text-white">{source.title || source.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false} className="rounded-2xl bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-start gap-3">
            <ScanSearch className="mt-1 h-5 w-5 text-cyan-100" />
            <div>
              <p className="text-lg font-semibold text-white">Latest Scan Result</p>
              <p className="mt-2 text-sm text-slate-400">The newest verification stays visible here with the original preview, verdict, and time.</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Original Input</p>
            <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-7 text-slate-300">
              {latestRecord?.sourcePreview || "No scan data yet."}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Score" value={`${score}%`} />
              <MiniMetric label="Verdict" value={category} />
              <MiniMetric
                label="Time"
                value={latestRecord?.timestamp ? <ClientDateText value={latestRecord.timestamp} mode="time" fallbackLabel={latestRecord.timestamp.slice(11, 16)} /> : "--:--"}
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {smallStats.map((item) => (
          <Card key={item.label} hover={false} className="rounded-2xl bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          </Card>
        ))}
      </section>

      <RealtimeTrustFeed items={filteredFeed} />
      <HistoryTimeline records={filteredRecords} />
    </div>
  );
}

function SignalCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl shadow-lg transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_16px_36px_rgba(15,23,42,0.24)]">
      <div className="flex items-center gap-2 text-cyan-100">
        {icon}
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
