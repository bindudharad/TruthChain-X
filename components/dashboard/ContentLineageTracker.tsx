"use client";

import { motion } from "framer-motion";

type LineageNode = {
  stage: string;
  label: string;
};

export function ContentLineageTracker({ lineage }: { lineage: LineageNode[] }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Content Lineage Tracking</p>
        <p className="text-sm text-slate-400">Origin and spread path of the current narrative across channels.</p>
      </div>
      <div className="space-y-4">
        {lineage.map((node, index) => (
          <div key={`${node.stage}-${node.label}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-cyan-400" />
              {index < lineage.length - 1 ? <div className="mt-2 h-14 w-px bg-gradient-to-b from-cyan-400/50 to-transparent" /> : null}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{node.stage}</p>
              <p className="mt-1 text-sm text-slate-200">{node.label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
