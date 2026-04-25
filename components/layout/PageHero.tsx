"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { slideUp, staggerChildren, cardReveal } from "@/animations/presets";

export function PageHero({
  eyebrow,
  title,
  description,
  badges = [],
  stats = []
}: {
  eyebrow: string;
  title: string;
  description: string;
  badges?: Array<{ label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" }>;
  stats?: Array<{ label: string; value: ReactNode; detail?: string }>;
}) {
  return (
    <motion.section variants={staggerChildren} initial="hidden" animate="visible" className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <motion.div variants={slideUp}>
        <Card hover={false} className="panel-subtle overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(56,189,248,0.1),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">{eyebrow}</p>
              <p className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-white">{title}</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={badge.label} tone={badge.tone || "info"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="status-pulse hidden h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 md:flex">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={cardReveal}>
              <Card hover={false} className="panel-subtle p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                <p suppressHydrationWarning className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                {stat.detail ? <p className="mt-2 text-sm leading-6 text-slate-400">{stat.detail}</p> : null}
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
