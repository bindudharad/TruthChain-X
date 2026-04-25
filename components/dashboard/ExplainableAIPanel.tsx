"use client";

import { motion } from "framer-motion";
import { ExplainabilityFactor } from "@/lib/types";

export function ExplainableAIPanel({
  highlights,
  reasoning,
  factors = []
}: {
  highlights: string[];
  reasoning: string;
  factors?: ExplainabilityFactor[];
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Explainable AI</p>
        <p className="text-sm text-slate-400">Key evidence highlights and reasoning breadcrumbs behind the final verdict.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight) => (
          <span key={highlight} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
            {highlight}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/25 p-4 text-sm leading-7 text-slate-300">{reasoning}</div>
      {factors.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {factors.map((factor) => (
            <div key={factor.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{factor.label}</p>
                <span className="text-sm text-slate-300">{factor.value}%</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{factor.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
