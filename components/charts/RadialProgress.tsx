"use client";

import { memo, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function ringColor(value: number) {
  if (value < 40) return "#F43F5E";
  if (value < 70) return "#FACC15";
  return "#22C55E";
}

function RadialProgressBase({
  value,
  label,
  size = 220
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const progress = useMotionValue(0);
  const animated = useSpring(progress, { damping: 20, stiffness: 120 });
  const rounded = useTransform(animated, (next) => Math.round(next));
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const dash = useTransform(animated, (next) => `${(next / 100) * circumference} ${circumference}`);
  const glow = ringColor(value);

  useEffect(() => {
    progress.set(value);
  }, [progress, value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          stroke={glow}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dash}
          style={{ filter: `drop-shadow(0 0 10px ${glow}44)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <motion.div
          animate={{ boxShadow: [`0 0 0 ${glow}00`, `0 0 28px ${glow}22`, `0 0 0 ${glow}00`] }}
          transition={{ duration: 2.8, repeat: Infinity }}
          className="rounded-full border border-white/10 bg-slate-950/45 px-8 py-7"
        >
          <motion.span className="block text-5xl font-semibold text-white">{rounded}</motion.span>
          <span className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export const RadialProgress = memo(RadialProgressBase);
