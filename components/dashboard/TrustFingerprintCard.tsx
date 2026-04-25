"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const badgeStyle = {
  low: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  high: "border-rose-400/25 bg-rose-400/10 text-rose-200"
};

function ringColor(score: number) {
  if (score < 40) return "#F43F5E";
  if (score < 70) return "#FACC15";
  return "#22C55E";
}

export function TrustFingerprintCard({
  score,
  risk,
  credibility,
  consensus,
  matches,
  confidence
}: {
  score: number;
  risk: "low" | "medium" | "high";
  credibility: "low" | "medium" | "high";
  consensus: number;
  matches: number;
  confidence: number;
}) {
  const progress = useMotionValue(0);
  const animated = useSpring(progress, { damping: 18, stiffness: 110 });
  const label = useTransform(animated, (value) => Math.round(value));
  const circumference = 2 * Math.PI * 74;
  const dash = useTransform(animated, (value) => `${(value / 100) * circumference} ${circumference}`);

  useEffect(() => {
    progress.set(score);
  }, [progress, score]);

  const glow = score < 40 ? "rgba(244,63,94,0.24)" : score < 70 ? "rgba(250,204,21,0.22)" : "rgba(34,197,94,0.22)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="panel panel-hover relative rounded-lg bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(99,102,241,0.12)_42%,rgba(9,19,31,0.26))] p-6"
    >
      <div className="pointer-events-none absolute inset-0 rounded-lg opacity-80" style={{ boxShadow: `inset 0 0 60px ${glow}` }} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Phishing Risk Signature</p>
          <p className="mt-2 text-2xl font-semibold text-white">Digital phishing identity</p>
          <p className="mt-2 text-sm text-slate-400">Live confidence model with manipulation risk, URL credibility, and content matching signals.</p>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          suppressHydrationWarning
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 shadow-[0_0_24px_rgba(56,189,248,0.12)]"
        >
          Confidence {confidence}%
        </motion.span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="relative grid h-56 w-56 place-items-center justify-self-center">
          <motion.div
            animate={{ boxShadow: [`0 0 24px ${glow}`, `0 0 54px ${glow}`, `0 0 24px ${glow}`] }}
            transition={{ repeat: Infinity, duration: 2.6 }}
            className="absolute inset-8 rounded-full"
          />
          <svg className="h-56 w-56 -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="74" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
            <motion.circle cx="90" cy="90" r="74" stroke={ringColor(score)} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={dash} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="rounded-full border border-white/10 bg-slate-950/45 px-8 py-7 shadow-[0_0_35px_rgba(14,165,233,0.12)]">
              <motion.span suppressHydrationWarning className="block text-5xl font-semibold text-white">{label}</motion.span>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Risk Confidence</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Manipulation Risk</p>
            <motion.span
              animate={{ boxShadow: [`0 0 0 ${glow}`, `0 0 16px ${glow}`, `0 0 0 ${glow}`] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-sm capitalize ${badgeStyle[risk]}`}
            >
              {risk}
            </motion.span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Source Credibility</p>
            <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-sm capitalize ${badgeStyle[credibility]}`}>{credibility}</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Consensus</p>
            <p suppressHydrationWarning className="mt-3 text-2xl font-semibold text-white">{consensus}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Similar Matches</p>
            <p suppressHydrationWarning className="mt-3 text-2xl font-semibold text-white">{matches}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
