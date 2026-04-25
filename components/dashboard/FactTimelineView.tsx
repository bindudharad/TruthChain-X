"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, RadioTower, ShieldCheck } from "lucide-react";
import { ClientDateText } from "@/components/ui/ClientDateText";
import { FactTimelineStep } from "@/lib/types";

function stepIcon(stage: FactTimelineStep["stage"]) {
  if (stage === "origin") return Clock3;
  if (stage === "spread") return RadioTower;
  if (stage === "flagged") return ShieldCheck;
  return CheckCircle2;
}

function tone(status: FactTimelineStep["status"]) {
  if (status === "complete") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  return "border-amber-400/20 bg-amber-400/10 text-amber-100";
}

export function FactTimelineView({ steps }: { steps: FactTimelineStep[] }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Fact Timeline</p>
        <p className="text-sm text-slate-400">Visualize the lifecycle of the content from ingestion through final verification.</p>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = stepIcon(step.stage);

          return (
            <div key={`${step.stage}-${step.timestamp}`} className="relative pl-16">
              {index < steps.length - 1 ? <div className="absolute left-[21px] top-11 h-[calc(100%-12px)] w-px bg-white/10" /> : null}
              <div className={`absolute left-0 top-1 flex h-11 w-11 items-center justify-center rounded-xl border ${tone(step.status)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium capitalize text-white">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-slate-500">{step.stage}</span>
                </div>
                <ClientDateText value={step.timestamp} mode="datetime" fallbackLabel={step.timestamp.replace("T", " ").slice(0, 16)} className="mt-3 text-xs text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
