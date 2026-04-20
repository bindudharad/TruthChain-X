"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Link2 } from "lucide-react";

export function VerificationStatus({
  status,
  transactionHash,
  timestamp
}: {
  status: "confirmed" | "queued";
  transactionHash: string;
  timestamp: string;
}) {
  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          animate={{ boxShadow: ["0 0 0 rgba(34,197,94,0.05)", "0 0 26px rgba(34,197,94,0.28)", "0 0 0 rgba(34,197,94,0.05)"] }}
          transition={{ repeat: Infinity, duration: 2.6 }}
          className="rounded-full border border-emerald-400/30 bg-emerald-500/10 p-2 text-emerald-300"
        >
          <BadgeCheck className="h-5 w-5" />
        </motion.div>
        <div>
          <p className="text-lg font-semibold">Verification status</p>
          <p className="text-sm text-slate-400">Immutable ledger proof for later verification</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <span>{status === "confirmed" ? "Stored on Blockchain" : "Queued for testnet write"}</span>
          <span className="rounded-full border border-emerald-400/20 px-2 py-0.5 text-xs">Live proof</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-slate-400">
            <Link2 className="h-4 w-4" />
            Transaction
          </div>
          <p className="mt-2 break-all font-mono text-xs">{transactionHash}</p>
          <p className="mt-3 text-xs text-slate-500">{new Date(timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
