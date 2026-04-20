"use client";

import { motion } from "framer-motion";
import { ConsensusReport } from "@/lib/types";

export function ConsensusMeter({
  consensus,
  executiveSummary
}: {
  consensus: ConsensusReport;
  executiveSummary: string;
}) {
  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">AI consensus meter</p>
          <p className="text-sm text-slate-400">This result is based on multiple AI systems.</p>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          {consensus.basedOn.length} models active
        </span>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-300">{consensus.label}</span>
          <span className="font-semibold text-white">{consensus.meter}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${consensus.meter}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Weighted truth</p>
          <p className="mt-2 text-2xl font-semibold text-white">{consensus.weightedTruthScore}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-white">{consensus.confidence}%</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{executiveSummary}</p>
    </div>
  );
}
