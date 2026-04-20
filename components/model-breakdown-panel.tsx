"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Cpu, Eye, Network, ShieldCheck, Sparkles } from "lucide-react";
import { ModelContribution } from "@/lib/types";

const icons = {
  groq: Sparkles,
  openrouter: BrainCircuit,
  gemma: ShieldCheck,
  huggingface: Eye,
  nemotron: Network,
  qwen: Cpu,
  flux: Sparkles
};

const verdictStyles = {
  real: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  uncertain: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  fake: "border-rose-400/20 bg-rose-400/10 text-rose-200"
};

export function ModelBreakdownPanel({ models }: { models: ModelContribution[] }) {
  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Multi-model breakdown</p>
          <p className="text-sm text-slate-400">Each AI is used for a specific strength instead of being called blindly.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Orchestrated ensemble</span>
      </div>

      <div className="grid gap-3">
        {models.map((model) => {
          const Icon = icons[model.provider];
          return (
            <motion.div key={`${model.provider}-${model.role}`} whileHover={{ y: -2 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <Icon className="h-5 w-5 text-slate-100" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{model.provider.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500">{model.role}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs ${verdictStyles[model.verdict]}`}>{model.verdict}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Truth</p>
                  <p className="mt-2 text-xl font-semibold text-white">{model.truthScore}%</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                  <p className="mt-2 text-xl font-semibold text-white">{model.confidence}%</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latency</p>
                  <p className="mt-2 text-xl font-semibold text-white">{model.latencyMs}ms</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">{model.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {model.signals.map((signal) => (
                  <span key={`${model.provider}-${signal}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {signal}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
