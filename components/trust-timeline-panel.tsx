"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VerificationRecord } from "@/lib/types";
import ClientOnly from "@/components/ui/ClientOnly";
import { useMounted } from "@/hooks/useMounted";

export function TrustTimelinePanel({ records }: { records: VerificationRecord[] }) {
  const mounted = useMounted();
  const data = records
    .slice()
    .reverse()
    .map((record) => ({
      label: mounted ? new Date(record.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : record.timestamp.slice(5, 10),
      trust: record.trustFingerprint.aiConsensus,
      score: record.truthScore
    }));

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-4">
        <p className="text-lg font-semibold">Risk timeline</p>
        <p className="text-sm text-slate-400">Track how the phishing risk signature evolves as related content enters the system.</p>
      </div>
      <div className="h-72">
        <ClientOnly fallback={<div className="h-full rounded-xl border border-dashed border-white/10 bg-slate-950/30" />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trustFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120" }} />
              <Area type="monotone" dataKey="trust" stroke="#38BDF8" fill="url(#trustFill)" strokeWidth={3} animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </div>
  );
}
