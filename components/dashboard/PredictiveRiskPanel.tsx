"use client";

import { motion } from "framer-motion";

export function PredictiveRiskPanel({
  forecast,
  badge,
  rationale
}: {
  forecast: number;
  badge: "low" | "medium" | "high";
  rationale: string;
}) {
  const styles = {
    low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    medium: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    high: "border-rose-400/20 bg-rose-400/10 text-rose-200"
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Predictive Detection</p>
        <p className="text-sm text-slate-400">Forecasts how likely this narrative is to evolve into a high-risk misinformation wave.</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Future Fake Risk</p>
          <p className="mt-3 text-4xl font-semibold text-white">{forecast}%</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm capitalize ${styles[badge]}`}>{badge} risk badge</span>
      </div>
      <div className="mt-4 h-3 rounded-full bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${forecast}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{rationale}</p>
    </motion.div>
  );
}
