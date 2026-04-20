"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

const labels = {
  groq: "GROQ",
  gemma: "Gemma",
  hf: "HuggingFace",
  gpt: "GPT / OpenRouter"
};

function AIConsensusPanelBase({
  sources
}: {
  sources: { groq: number; gemma?: number; hf: number; gpt: number };
}) {
  const bars = [
    { id: "groq", value: Math.max(0, Math.min(100, sources?.groq ?? 0)) },
    { id: "gemma", value: Math.max(0, Math.min(100, sources?.gemma ?? sources?.groq ?? 0)) },
    { id: "hf", value: Math.max(0, Math.min(100, sources?.hf ?? 0)) },
    { id: "gpt", value: Math.max(0, Math.min(100, sources?.gpt ?? 0)) }
  ] as const;

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">AI Consensus Panel</p>
        <p className="text-sm text-slate-400">Weighted model contributions rendered as reusable animated bars.</p>
      </div>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.id}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">{labels[bar.id]}</span>
              <span className="text-white">{bar.value}%</span>
            </div>
            <div className="h-3 rounded-full border border-white/5 bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.value}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export const AIConsensusPanel = memo(AIConsensusPanelBase);
