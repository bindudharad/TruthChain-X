import { AppShell } from "@/components/layout/AppShell";
import { HistoryPanel } from "@/components/history-panel";
import { listCreatorProfiles, listVerifications } from "@/lib/db";
import { listUsageSnapshots } from "@/lib/platform";

export default async function ReportsPage() {
  const [records, creators] = await Promise.all([listVerifications(), listCreatorProfiles()]);
  const usage = listUsageSnapshots();
  const riskyCreators = creators.slice().sort((left, right) => left.credibilityScore - right.credibilityScore).slice(0, 5);

  return (
    <AppShell title="Reports Center" subtitle="Executive reporting, risk briefings, and platform readiness">
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Weekly trust briefing</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <p>
                TruthChain X now supports content trust, creator reputation, public trust APIs, usage tracking, and enterprise-ready analytics in a single product surface.
              </p>
              <p>
                The highest-risk cluster remains misinformation with low-source evidence and high repost volume. Creator credibility is degrading fastest where repeated low-truth submissions are tied to the same identity.
              </p>
              <p>
                For GTM, the strongest launch package is a free API tier for independent builders, a pro plan for moderation tools, and an enterprise plan for platforms that need analytics, bulk verification, and audit trails.
              </p>
            </div>
          </div>
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Enterprise readiness checklist</p>
            <div className="mt-5 space-y-3">
              {[
                "API key plans and usage tracking are active",
                "JWT-based demo auth is available for product walkthroughs",
                "Rate limiting and plan gating protect premium endpoints",
                "Analytics reporting aggregates trust, creator, and usage signals",
                "Blockchain proof remains demo-safe with queued fallback"
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="panel rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Top risky creators</p>
                <p className="text-sm text-slate-400">These are the identities most likely to trigger moderation escalation.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{riskyCreators.length} tracked</span>
            </div>
            <div className="space-y-3">
              {riskyCreators.map((creator) => (
                <div key={creator.creatorId} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{creator.displayName}</p>
                      <p className="text-xs text-slate-500">{creator.creatorId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-100">{creator.credibilityScore}%</p>
                      <p className="text-xs text-slate-500">{creator.flaggedCount} flagged / {creator.totalUploads} uploads</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">API revenue readiness</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { tier: "Free", copy: "1,000 monthly requests, trust lookups, lightweight scoring." },
                { tier: "Pro", copy: "Bulk verification, creator reputation, analytics export." },
                { tier: "Enterprise", copy: "Private dashboards, higher quotas, platform reporting." }
              ].map((plan) => (
                <div key={plan.tier} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{plan.tier}</p>
                  <p className="mt-2 text-sm text-slate-400">{plan.copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              Total tracked API usage events: <span className="font-semibold text-white">{usage.length}</span>
            </div>
          </div>
        </section>

        <HistoryPanel records={records.slice(0, 8)} />
      </div>
    </AppShell>
  );
}
