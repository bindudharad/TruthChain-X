"use client";

import { motion } from "framer-motion";
import { Activity, Blocks, Radar, ScanSearch } from "lucide-react";
import { VerificationRecord } from "@/lib/types";

export function SummaryCards({ records }: { records: VerificationRecord[] }) {
  const avgScore = records.length ? Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / records.length) : 0;
  const avgConfidence = records.length ? Math.round(records.reduce((sum, record) => sum + record.confidence, 0) / records.length) : 0;
  const flagged = records.filter((record) => record.truthScore < 40).length;
  const confirmed = records.filter((record) => record.blockchainStatus === "confirmed").length;
  const repeated = records.reduce((sum, record) => sum + Math.max(record.occurrenceCount - 1, 0), 0);

  const cards = [
    { label: "Average truth score", value: `${avgScore}%`, icon: Activity, accent: "from-cyan-500/20 to-sky-500/5" },
    { label: "Average confidence", value: `${avgConfidence}%`, icon: Activity, accent: "from-sky-500/20 to-cyan-500/5" },
    { label: "Flagged content", value: `${flagged}`, icon: Radar, accent: "from-rose-500/20 to-orange-500/5" },
    { label: "On-chain proofs", value: `${confirmed}`, icon: Blocks, accent: "from-emerald-500/20 to-teal-500/5" },
    { label: "Repeat uploads", value: `${repeated}`, icon: ScanSearch, accent: "from-violet-500/20 to-fuchsia-500/5" }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ y: -4 }}
          className={`panel rounded-lg bg-gradient-to-br ${card.accent} p-5`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <card.icon className="h-5 w-5 text-slate-200" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
