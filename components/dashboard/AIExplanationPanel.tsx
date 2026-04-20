"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function Typewriter({ text }: { text: string }) {
  const [visible, setVisible] = useState("");
  useEffect(() => {
    setVisible("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 12);
    return () => clearInterval(timer);
  }, [text]);
  const keywords = ["fake", "manipulated", "risk", "credible", "suspicious", "verified", "deepfake"];
  const parts = visible.split(new RegExp(`(${keywords.join("|")})`, "gi"));

  return (
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
  );
}

export function AIExplanationPanel({ explanation }: { explanation: string }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className="panel panel-hover rounded-lg p-6">
      <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpen((value) => !value)}>
        <div>
          <p className="text-lg font-semibold text-white">AI Explanation</p>
          <p className="text-sm text-slate-400">Human-readable reasoning with a typewriter reveal.</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <Typewriter text={explanation} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
