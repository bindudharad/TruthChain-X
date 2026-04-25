import { AppShell } from "@/components/layout/AppShell";
import { PageHero } from "@/components/layout/PageHero";
import { UnifiedFraudReportingDashboard } from "@/components/reporting/UnifiedFraudReportingDashboard";
import { Card } from "@/components/ui/Card";
import { getReportHistory } from "@/services/reporting/orchestrator";
import { listRecentSimilarityMatches } from "@/services/similarity/engine";

export default async function ReportsPage() {
  const [matches, history] = await Promise.all([listRecentSimilarityMatches(12), getReportHistory()]);

  return (
    <AppShell title="Reports Center" subtitle="Unified Fraud Reporting Orchestrator and moderation lifecycle">
      <div className="space-y-6">
        <PageHero
          eyebrow="Moderation Mission"
          title="Turn detection into safe, explainable action"
          description="The reporting page is the final demo beat: once the system explains the risk, it shows clear, governed follow-through with bulk selection, status tracking, and safe dispatch modes."
          badges={[
            { label: "Structured Evidence", tone: "info" },
            { label: "Safe Dispatch Only", tone: "success" },
            { label: "Audit Trail Active", tone: "info" }
          ]}
          stats={[
            { label: "Available Matches", value: `${matches.length}`, detail: "Seeded and live moderation candidates" },
            { label: "Report History", value: `${history.reports.length}`, detail: "Tracked report lifecycle items" }
          ]}
        />

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Card hover={false}>
            <p className="text-lg font-semibold text-white">Dispatch Modes</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { title: "Link Mode", copy: "Prepare the evidence and open the official platform reporting form." },
                { title: "API Mode", copy: "Use supported internal moderation APIs where structured reporting is available." },
                { title: "Demo Mode", copy: "Simulate realistic moderator workflow for hackathon and product demos." }
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <UnifiedFraudReportingDashboard initialMatches={matches} initialReports={history.reports} initialAudit={history.audit} />
      </div>
    </AppShell>
  );
}
