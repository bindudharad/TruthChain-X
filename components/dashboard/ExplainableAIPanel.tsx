"use client";

import { motion } from "framer-motion";

export function ExplainableAIPanel({
  highlights,
  reasoning
}: {
  highlights: string[];
  reasoning: string;
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
    </motion.div>
  );
}
