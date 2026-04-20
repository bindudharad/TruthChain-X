"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";

const LineChartComponent = dynamic(() => import("@/components/charts/LineChartComponent").then((mod) => mod.LineChartComponent), {
  ssr: false
});
const BarChartComponent = dynamic(() => import("@/components/charts/BarChartComponent").then((mod) => mod.BarChartComponent), {
  ssr: false
});

type GraphRecord = {
  timestamp: string;
  score: number;
};

export function Graphs({ records }: { records: GraphRecord[] }) {
  const [window, setWindow] = useState<"all" | "recent">("all");
  const source = useMemo(() => (window === "recent" ? records.slice(0, 6) : records), [records, window]);
  const hasRecords = source.length > 0;

  const lineData = useMemo(
    () =>
      source
        .slice()
        .reverse()
        .map((record) => ({
          label: new Date(record.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          score: record.score
        })),
    [source]
  );

  const distribution = useMemo(
    () => [
      { name: "Fake", value: source.filter((record) => record.score < 40).length },
      { name: "Uncertain", value: source.filter((record) => record.score >= 40 && record.score < 70).length },
      { name: "Real", value: source.filter((record) => record.score >= 70).length }
    ],
    [source]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">Trust Score Over Time</p>
            <p className="text-sm text-slate-400">Reusable animated line chart with filtering support.</p>
          </div>
          <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
            {(["all", "recent"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setWindow(value)}
                className={`rounded-lg px-3 py-1.5 capitalize transition ${window === value ? "bg-cyan-400/14 text-cyan-100" : "text-slate-400"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          {hasRecords ? (
            <LineChartComponent data={lineData} xKey="label" yKey="score" />
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 text-sm text-slate-400">
              No trust history yet. Verify a piece of content to start the timeline.
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <p className="text-lg font-semibold text-white">Fake vs Real Distribution</p>
          <p className="text-sm text-slate-400">Reusable animated bar chart with color-coded outputs.</p>
        </div>
        <div className="h-72">
          {hasRecords ? (
            <BarChartComponent data={distribution} xKey="name" yKey="value" colors={["#F43F5E", "#FACC15", "#22C55E"]} />
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 text-sm text-slate-400">
              Distribution charts will appear after the first verification result lands.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
