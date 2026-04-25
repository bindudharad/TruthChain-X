"use client";

import { motion } from "framer-motion";

const labels = {
  groq: "GROQ",
  gemma: "Gemma",
  hf: "HuggingFace",
  gpt: "GPT / OpenRouter"
};

export function AIConsensusPanel({
  sources
}: {
  sources: { groq: number; gemma?: number; hf: number; gpt: number };
}) {
  const bars = [
    { id: "groq", value: sources.groq },
    { id: "gemma", value: sources.gemma ?? sources.groq },
    { id: "hf", value: sources.hf },
    { id: "gpt", value: sources.gpt }
  ] as const;

  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className="panel panel-hover rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">AI Consensus Panel</p>
        <p className="text-sm text-slate-400">Specialized models contribute weighted signals to the final phishing risk signature.</p>
      </div>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.id}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">{labels[bar.id]}</span>
              <span className="text-white">{bar.value}%</span>
            </div>
            <div className="h-3 rounded-full border border-white/5 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.value}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
