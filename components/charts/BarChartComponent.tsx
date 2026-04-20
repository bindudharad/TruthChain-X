"use client";

import { memo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function BarChartComponentBase({
  data,
  xKey,
  yKey,
  colors
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  colors?: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey={xKey} stroke="#94A3B8" tickLine={false} axisLine={false} />
        <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "#081120", boxShadow: "0 14px 32px rgba(3,8,18,0.35)" }} />
        <Bar dataKey={yKey} radius={[8, 8, 0, 0]} animationDuration={900} animationEasing="ease-out">
          {data.map((entry, index) => (
            <Cell key={`${entry[xKey]}-${index}`} fill={colors?.[index] || "#38BDF8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const BarChartComponent = memo(BarChartComponentBase);
