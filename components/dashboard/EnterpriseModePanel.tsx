"use client";

import { motion } from "framer-motion";

export function EnterpriseModePanel({
  enabled,
  onToggle,
  analytics
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  analytics: Array<{ label: string; value: string }>;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">Enterprise Mode</p>
          <p className="text-sm text-slate-400">Operator-focused analytics view for newsroom, platform, and trust-and-safety teams.</p>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          Enterprise
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
