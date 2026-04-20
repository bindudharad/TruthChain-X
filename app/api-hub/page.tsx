import { AppShell } from "@/components/layout/AppShell";
import { createDemoPrincipal, listApiKeys, listUsageSnapshots } from "@/lib/platform";

const endpointCatalog = [
  { method: "POST", path: "/api/verify-content", plan: "Free", description: "Verify one content item and return the full trust fingerprint." },
  { method: "GET", path: "/api/trust-score/{id}", plan: "Free", description: "Fetch a previously stored trust score by content hash." },
  { method: "GET", path: "/api/creator-reputation/{id}", plan: "Free", description: "Retrieve creator credibility and identity history." },
  { method: "POST", path: "/api/bulk-verify", plan: "Pro", description: "Submit up to 10 items for batch trust analysis." },
  { method: "GET", path: "/api/analytics/report", plan: "Enterprise", description: "Pull a platform-wide report for trends, creators, and hotspots." }
];

export default function ApiHubPage() {
  const keys = listApiKeys();
  const usage = listUsageSnapshots();
  const demoJwt = createDemoPrincipal("enterprise", "enterprise");

  return (
    <AppShell title="API Hub" subtitle="Productized trust infrastructure for partners, platforms, and enterprise clients">
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Authentication</p>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                Use <span className="font-mono text-cyan-200">x-api-key</span> for platform integrations.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                Use <span className="font-mono text-cyan-200">Authorization: Bearer &lt;jwt&gt;</span> for dashboard and enterprise clients.
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/30 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">Demo Enterprise JWT</p>
                <p className="break-all font-mono text-xs text-slate-300">{demoJwt}</p>
              </div>
            </div>
          </div>
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Plan inventory</p>
            <div className="mt-5 space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{key.label}</p>
                      <p className="text-xs text-slate-500">{key.plan} plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-200">{key.requestsUsed}/{key.monthlyQuota}</p>
                      <p className="text-xs text-slate-500">requests used</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel rounded-lg p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Endpoint catalog</p>
              <p className="text-sm text-slate-400">API-first building blocks for moderation tools, social platforms, and enterprise trust workflows.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{endpointCatalog.length} routes</span>
          </div>
          <div className="space-y-3">
            {endpointCatalog.map((endpoint) => (
              <div key={endpoint.path} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">{endpoint.method}</span>
                  <span className="font-mono text-sm text-white">{endpoint.path}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{endpoint.plan}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Integration example</p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300"><code>{`curl -X POST http://localhost:3000/api/verify-content \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: tcx_pro_demo_key" \\
  -d '{"type":"text","content":"Breaking: miracle cure goes viral","fileName":"claim.txt","creatorId":"creator_demo","creatorName":"Demo Creator"}'`}</code></pre>
          </div>
          <div className="panel rounded-lg p-6">
            <p className="text-lg font-semibold text-white">Usage telemetry</p>
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Total usage events tracked: <span className="font-semibold text-white">{usage.length}</span>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Rate limiting and plan gating now protect the product-facing API surface.
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
