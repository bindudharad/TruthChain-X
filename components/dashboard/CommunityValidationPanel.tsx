"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { CommunityValidation } from "@/lib/types";

export function CommunityValidationPanel({
  hash,
  initial
}: {
  hash: string;
  initial: CommunityValidation;
}) {
  const [votes, setVotes] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function submitVote(direction: "up" | "down") {
    setLoading(true);
    const response = await fetch("/api/community-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash, direction })
    });
    const data = (await response.json()) as CommunityValidation;
    setVotes(data);
    setLoading(false);
  }

  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Community Validation</p>
        <p className="text-sm text-slate-400">Crowd-assisted trust signal layered on top of AI and blockchain verification.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          disabled={loading}
          onClick={() => submitVote("up")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 transition hover:scale-[1.01]"
        >
          <ThumbsUp className="h-4 w-4" />
          Trust
        </button>
        <button
          disabled={loading}
          onClick={() => submitVote("down")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 transition hover:scale-[1.01]"
        >
          <ThumbsDown className="h-4 w-4" />
          Flag
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">Upvotes: {votes.upvotes}</div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">Downvotes: {votes.downvotes}</div>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/25 p-4 text-sm text-slate-300">{votes.consensusLabel}</div>
    </motion.div>
  );
}
