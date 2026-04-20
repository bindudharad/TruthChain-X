"use client";

import { BadgeCheck, Shield, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { CreatorProfile } from "@/lib/types";

const riskStyles = {
  low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  high: "border-rose-400/20 bg-rose-400/10 text-rose-200"
};

export function CreatorProfilePanel({ creator }: { creator: CreatorProfile }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-slate-100">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{creator.displayName}</p>
            <p className="text-sm text-slate-400">Creator identity intelligence</p>
          </div>
        </div>
        {creator.verifiedBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <BadgeCheck className="h-4 w-4" />
            Verified
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credibility Score</p>
          <p className="mt-3 text-3xl font-semibold text-white">{creator.credibilityScore}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk Level</p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-sm capitalize ${riskStyles[creator.riskLevel]}`}>{creator.riskLevel}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uploads</p>
          <p className="mt-3 text-2xl font-semibold text-white">{creator.totalUploads}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Identity Anchor</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <Shield className="h-4 w-4" />
            <span>{creator.identityStatus === "confirmed" ? "On-chain" : "Queued"}</span>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">{creator.blockchainIdentityId}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/25 p-4 text-sm leading-7 text-slate-300">{creator.historySummary}</div>
    </motion.div>
  );
}
