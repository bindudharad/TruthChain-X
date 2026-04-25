"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { api } from "@/services/api";
import { VerificationRecord } from "@/lib/types";

type RemoteRiskData = {
  totals: { highRiskContent: number; averageTrust: number; trackedCreators: number };
  topRiskCreators: Array<{ creatorId: string; displayName: string; credibilityScore: number; flaggedCount: number }>;
};

function TrustRiskDashboardBase({ records }: { records: VerificationRecord[] }) {
  const [remote, setRemote] = useState<RemoteRiskData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      api
        .get<RemoteRiskData>("/api/risk-dashboard")
        .then((data) => {
          if (!cancelled) setRemote(data);
        })
        .catch(() => undefined);
    };

    load();
    const timer = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const stats = useMemo(
    () => ({
      highRisk: records.filter((record) => record.truthScore < 40).length,
      warning: records.filter((record) => record.truthScore >= 40 && record.truthScore < 70).length,
      average: Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / Math.max(records.length, 1))
    }),
    [records]
  );

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Trust Risk Dashboard</p>
        <p className="text-sm text-slate-400">High-risk content, warning narratives, and the trust baseline of the platform at a glance.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="High-risk content" value={String(remote?.totals.highRiskContent ?? stats.highRisk)} tone="text-rose-200" />
        <Stat label="Warning content" value={String(stats.warning)} tone="text-amber-200" />
        <Stat label="Average trust" value={`${remote?.totals.averageTrust ?? stats.average}%`} tone="text-cyan-200" />
      </div>

      {remote?.topRiskCreators?.length ? (
        <div className="mt-4 space-y-2">
          {remote.topRiskCreators.slice(0, 3).map((creator) => (
            <div key={creator.creatorId} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {creator.displayName} | {creator.credibilityScore}% credibility | {creator.flaggedCount} flagged
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
          No creator risk spikes are active yet. Creator trust rankings will appear here as more verifications are recorded.
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export const TrustRiskDashboard = memo(TrustRiskDashboardBase);
