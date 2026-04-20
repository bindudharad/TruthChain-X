"use client";

import { motion } from "framer-motion";
import { TrendingAlert } from "@/lib/types";

const riskStyles = {
  low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  moderate: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  high: "border-orange-400/20 bg-orange-400/10 text-orange-200",
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-200"
};

export function AlertsPanel({ alerts }: { alerts: TrendingAlert[] }) {
  const visibleAlerts = alerts.slice(0, 4);

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Viral alerts</p>
          <p className="text-sm text-slate-400">Trending content clusters flagged for rapid misinformation spread.</p>
        </div>
        <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="h-3 w-3 rounded-full bg-rose-400" />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-slate-950/30 p-3">
        {visibleAlerts.length ? (
          visibleAlerts.map((alert) => (
            <motion.div
              key={`${alert.id}-heat`}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ repeat: Infinity, duration: 2 + alert.volume / 100 }}
              className="rounded-md"
              style={{
                height: "52px",
                background: `linear-gradient(180deg, rgba(244,63,94,${Math.max(alert.volume / 110, 0.2)}), rgba(14,23,38,0.55))`
              }}
              title={`${alert.label}: ${alert.volume}%`}
            />
          ))
        ) : (
          <div className="col-span-4 rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
            No active viral spikes right now. This panel will light up when risky content starts spreading.
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {visibleAlerts.map((alert) => (
          <motion.div key={alert.id} whileHover={{ y: -2 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-100">{alert.label}</p>
                <p className="mt-1 text-xs text-slate-500">{`${alert.category} | ${alert.region}`}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs ${riskStyles[alert.riskLevel]}`}>{alert.riskLevel}</span>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Spread intensity</span>
                <span>{alert.volume}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${alert.volume}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
