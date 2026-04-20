"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TypewriterText } from "@/components/typewriter-text";

export function ExplanationCard({
  executiveSummary,
  explanation,
  findings,
  suspiciousSignals
}: {
  executiveSummary: string;
  explanation: string;
  findings: string[];
  suspiciousSignals: string[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="panel rounded-lg p-6">
      <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpen((value) => !value)}>
        <div>
          <p className="text-lg font-semibold">AI explanation</p>
          <p className="text-sm text-slate-400">Simple-language reasoning with supporting cues</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">{executiveSummary}</div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <TypewriterText text={explanation} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">Findings</p>
                  <div className="space-y-2 text-sm text-slate-300">{findings.map((item) => <p key={item}>{item}</p>)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">Signals</p>
                  <div className="space-y-2 text-sm text-slate-300">{suspiciousSignals.map((item) => <p key={item}>{item}</p>)}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
