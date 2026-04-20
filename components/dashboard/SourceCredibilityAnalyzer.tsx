"use client";

import { motion } from "framer-motion";

export function SourceCredibilityAnalyzer({
  score,
  reliability,
  historyLabel
}: {
  score: number;
  reliability: "low" | "medium" | "high";
  historyLabel: string;
}) {
  const styles = {
    low: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    medium: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    high: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Source Credibility Analyzer</p>
        <p className="text-sm text-slate-400">Past reliability and source behavior weighted into the trust layer.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credibility Score</p>
          <p className="mt-3 text-3xl font-semibold text-white">{score}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reliability Level</p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-sm capitalize ${styles[reliability]}`}>{reliability}</span>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">{historyLabel}</div>
    </motion.div>
  );
}
