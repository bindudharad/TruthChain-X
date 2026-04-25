"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VerificationRecord } from "@/lib/types";
import ClientOnly from "@/components/ui/ClientOnly";
import { useMounted } from "@/hooks/useMounted";

function formatDateLabel(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChartsPanel({ records }: { records: VerificationRecord[] }) {
  const mounted = useMounted();
  const lineData = records
    .slice()
    .reverse()
    .map((record) => ({ label: mounted ? formatDateLabel(record.timestamp) : record.timestamp.slice(5, 10), score: record.truthScore }));

  const distribution = [
    { name: "Likely Fake", value: records.filter((record) => record.truthScore < 40).length, color: "#F43F5E" },
    { name: "Needs Review", value: records.filter((record) => record.truthScore >= 40 && record.truthScore < 70).length, color: "#FACC15" },
    { name: "Likely Real", value: records.filter((record) => record.truthScore >= 70).length, color: "#22C55E" }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="panel rounded-lg p-6">
        <div className="mb-4">
          <p className="text-lg font-semibold">Truth scores over time</p>
          <p className="text-sm text-slate-400">Track how recent submissions trend as new content is checked.</p>
        </div>
        <div className="h-72">
          <ClientOnly fallback={<div className="h-full rounded-xl border border-dashed border-white/10 bg-slate-950/30" />}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120" }} />
                <Line type="monotone" dataKey="score" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      </div>

      <div className="panel rounded-lg p-6">
        <div className="mb-4">
          <p className="text-lg font-semibold">Risk distribution</p>
          <p className="text-sm text-slate-400">Snapshot of likely fake, uncertain, and likely authentic content.</p>
        </div>
        <div className="h-72">
          <ClientOnly fallback={<div className="h-full rounded-xl border border-dashed border-white/10 bg-slate-950/30" />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={700}>
                  {distribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
