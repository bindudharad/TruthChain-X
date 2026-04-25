"use client";

import { motion } from "framer-motion";

type ExtensionPreviewProps = {
  verdict: "safe" | "warning";
  score: number;
  message: string;
};

function badgeTone(verdict: ExtensionPreviewProps["verdict"]) {
  return verdict === "warning"
    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
}

export default function ExtensionPreview({ verdict, score, message }: ExtensionPreviewProps) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Browser Threat Preview</p>
        <p className="text-sm text-slate-400">A production-style extension preview showing how live phishing feedback can appear before a user submits credentials or shares a risky page.</p>
      </div>

      <div className="mx-auto w-full max-w-sm rounded-lg border border-white/10 bg-[#0F172A] p-4 shadow-[0_18px_60px_rgba(8,15,28,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">TruthChain-X</p>
            <p className="text-xs text-slate-400">Live page phishing signal</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${badgeTone(verdict)}`}>
            {verdict === "warning" ? "Likely Fake" : "Likely Safe"}
          </span>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phishing Risk Score</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-white">{score}%</p>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${verdict === "warning" ? "bg-rose-400" : "bg-emerald-400"}`}
              />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
        </div>

        <div className="mt-4 grid gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            Risk signature history, page context, and supporting evidence can all open from this surface.
          </div>
          <button className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
            {verdict === "warning" ? "Review evidence" : "Open scan details"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ExtensionMock(props: ExtensionPreviewProps) {
  return <ExtensionPreview {...props} />;
}
