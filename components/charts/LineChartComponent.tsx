"use client";

import { memo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function LineChartComponentBase({
  data,
  xKey,
  yKey
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="line-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey={xKey} stroke="#94A3B8" tickLine={false} axisLine={false} />
        <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip cursor={{ stroke: "rgba(56,189,248,0.18)", strokeWidth: 1 }} contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120", boxShadow: "0 14px 32px rgba(3,8,18,0.35)" }} />
        <Area type="monotone" dataKey={yKey} stroke="#38BDF8" fill="url(#line-chart-fill)" strokeWidth={3} animationDuration={900} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const LineChartComponent = memo(LineChartComponentBase);
