"use client";

import { memo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { useTypewriter } from "@/hooks/useTypewriter";

function AIExplanationPanelBase({ explanation }: { explanation: string }) {
  const [open, setOpen] = useState(true);
  const fallbackExplanation =
    explanation?.trim() || "No detailed reasoning is available yet. The score and consensus panels still reflect the latest trust analysis.";
  const visible = useTypewriter(fallbackExplanation);
  const keywords = ["fake", "manipulated", "risk", "credible", "suspicious", "verified", "deepfake"];
  const parts = visible.split(new RegExp(`(${keywords.join("|")})`, "gi"));

  return (
    <Card>
      <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpen((value) => !value)}>
        <div>
          <p className="text-lg font-semibold text-white">AI Explanation</p>
          <p className="text-sm text-slate-400">Expandable reasoning panel with typewriter output and keyword highlights.</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm leading-7 text-slate-300">
                {parts.map((part, index) => {
                  const isKeyword = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
                  return isKeyword ? (
                    <span key={`${part}-${index}`} className="rounded bg-rose-400/12 px-1 py-0.5 text-rose-100">
                      {part}
                    </span>
                  ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                  );
                })}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export const AIExplanationPanel = memo(AIExplanationPanelBase);
