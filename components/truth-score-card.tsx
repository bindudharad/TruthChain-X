"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function scoreColor(score: number) {
  if (score < 40) return { stroke: "#F43F5E", glow: "rgba(244,63,94,0.25)", label: "Likely false" };
  if (score < 70) return { stroke: "#FACC15", glow: "rgba(250,204,21,0.2)", label: "Needs review" };
  return { stroke: "#22C55E", glow: "rgba(34,197,94,0.22)", label: "Likely authentic" };
}

export function TruthScoreCard({ score, confidence }: { score: number; confidence: number }) {
  const progress = useMotionValue(0);
  const animated = useSpring(progress, { damping: 18, stiffness: 110 });
  const label = useTransform(animated, (value) => Math.round(value));
  const visual = scoreColor(score);
  const circumference = 2 * Math.PI * 74;
  const dash = useTransform(animated, (value) => `${(value / 100) * circumference} ${circumference}`);

  useEffect(() => {
    progress.set(score);
  }, [progress, score]);

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Truth score</p>
          <p className="text-sm text-slate-400">Composite AI confidence on misinformation risk</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{visual.label}</span>
      </div>
      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="relative grid h-44 w-44 place-items-center">
          <svg className="h-44 w-44 -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="74" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
            <motion.circle
              cx="90"
              cy="90"
              r="74"
              stroke={visual.stroke}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              style={{ filter: `drop-shadow(0 0 16px ${visual.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <motion.span className="text-4xl font-semibold">{label}</motion.span>
            <span className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">Score</span>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Confidence</p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{confidence}%</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Decision rule</p>
            <p className="mt-2 text-sm text-slate-300">Cross-check content hash, signal anomalies, and claim-level risk markers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
