"use client";

import { motion } from "framer-motion";

type DebateSide = {
  speaker: string;
  stance: "supports" | "challenges";
  message: string;
};

const stanceStyle = {
  supports: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  challenges: "border-rose-400/20 bg-rose-400/10 text-rose-100"
};

export function AIDebateMode({
  left,
  right,
  consensus
}: {
  left: DebateSide;
  right: DebateSide;
  consensus: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">AI Debate Mode</p>
        <p className="text-sm text-slate-400">Conflicting model viewpoints are surfaced before the final ensemble decides.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[left, right].map((side) => (
          <div key={side.speaker} className={`rounded-lg border p-4 ${stanceStyle[side.stance]}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{side.speaker}</p>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]">
                {side.stance}
              </span>
            </div>
            <p className="text-sm leading-7">{side.message}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{consensus}</div>
    </motion.div>
  );
}
