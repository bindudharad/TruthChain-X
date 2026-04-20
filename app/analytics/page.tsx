import { AppShell } from "@/components/layout/AppShell";
import { AlertsPanel } from "@/components/alerts-panel";
import { Graphs } from "@/components/dashboard/Graphs";
import { GlobalHeatmap } from "@/components/dashboard/GlobalHeatmap";
import { listCreatorProfiles, listVerifications, buildTrendingAlerts } from "@/lib/db";
import { listUsageSnapshots } from "@/lib/platform";
import { buildAnalyticsReport } from "@/lib/analytics";

export default async function AnalyticsPage() {
  const [records, creators] = await Promise.all([listVerifications(), listCreatorProfiles()]);
  const alerts = buildTrendingAlerts(records);
  const usage = listUsageSnapshots();
  const report = buildAnalyticsReport(records, creators, usage);

  const graphRecords = records.map((record) => ({ timestamp: record.timestamp, score: record.truthScore }));
  const heatRegions = report.hotspotRegions.map((region, index) => ({
    region: region.region,
    x: ["24%", "49%", "66%", "52%", "75%"][index % 5],
    y: ["36%", "28%", "46%", "58%", "68%"][index % 5],
    intensity: region.intensity
  }));

  return (
    <AppShell title="Analytics Command" subtitle="Global trust trends, creator risk, and monetization telemetry">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Verifications", value: report.totals.verifications, accent: "text-cyan-200" },
            { label: "Flagged Content", value: report.totals.flaggedContent, accent: "text-rose-200" },
            { label: "Tracked Creators", value: report.totals.creators, accent: "text-violet-200" },
            { label: "API Requests", value: report.monetization.apiRequestsTracked, accent: "text-emerald-200" }
          ].map((item) => (
            <div key={item.label} className="panel rounded-lg p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Graphs records={graphRecords} />
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Trust score distribution</p>
            <div className="mt-5 space-y-4">
              {report.distribution.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500" style={{ width: `${Math.max(8, item.value * 12)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              Average truth score across the platform is <span className="font-semibold text-white">{report.totals.averageTruthScore}%</span>. This is the number you watch when enterprise clients ask whether the threat environment is worsening.
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <AlertsPanel alerts={alerts} />
          <GlobalHeatmap regions={heatRegions} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="panel rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Top risky creators</p>
                <p className="text-sm text-slate-400">Creators with the weakest reputation trends and highest flagged content load.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Enterprise lens</span>
            </div>
            <div className="space-y-3">
              {report.topRiskCreators.map((creator) => (
                <div key={creator.creatorId} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{creator.displayName}</p>
                      <p className="text-xs text-slate-500">{creator.creatorId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-rose-200">{creator.credibilityScore}% credibility</p>
                      <p className="text-xs text-slate-500">{creator.flaggedCount} flagged items</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Monetization telemetry</p>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                Free tier requests tracked: <span className="font-semibold text-white">{report.monetization.freeTierUtilization}</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                Enterprise client activity detected: <span className="font-semibold text-white">{report.monetization.enterpriseReady ? "Yes" : "Not yet"}</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                Usage storage and plan tracking are now wired for API monetization experiments.
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
