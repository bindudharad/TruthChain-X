"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useMounted } from "@/hooks/useMounted";
import ClientOnly from "@/components/ui/ClientOnly";

type TimelinePoint = {
  timestamp: string;
  trust: number;
};

export function TrustEvolutionTimeline({ points }: { points: TimelinePoint[] }) {
  const mounted = useMounted();
  const data = useMemo(
    () =>
      points
        .slice()
        .reverse()
        .map((point) => ({
          label: mounted ? new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : point.timestamp.slice(11, 16),
          trust: point.trust
        })),
    [mounted, points]
  );

  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-4">
        <p className="text-lg font-semibold text-white">Trust Evolution Timeline</p>
        <p className="text-sm text-slate-400">Watch how confidence and trust move as similar content enters the system.</p>
      </div>
      <div className="h-72">
        <ClientOnly fallback={<div className="h-full rounded-xl border border-dashed border-white/10 bg-slate-950/30" />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120" }} />
              <Area type="monotone" dataKey="trust" stroke="#22D3EE" strokeWidth={3} fill="url(#timelineFill)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </motion.div>
  );
}
