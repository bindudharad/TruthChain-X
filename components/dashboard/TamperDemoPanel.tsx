"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type TamperResult = {
  attempted: boolean;
  success: boolean;
  message: string;
  mismatchReason: string;
};

export function TamperDemoPanel() {
  const [result, setResult] = useState<TamperResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function attemptTamper() {
    setLoading(true);
    const response = await fetch("/api/tamper-demo", { method: "POST" });
    const data = (await response.json()) as TamperResult;
    setResult(data);
    setLoading(false);
  }

  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Blockchain Tamper Demo</p>
        <p className="text-sm text-slate-400">Simulated attempt to alter a stored fingerprint after verification.</p>
      </div>
      <button
        onClick={attemptTamper}
        disabled={loading}
        className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 transition hover:scale-[1.01]"
      >
        {loading ? "Testing tamper resistance..." : "Attempt Tamper"}
      </button>
      {result ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/25 p-4 text-sm text-slate-300">
          <p className="font-medium text-white">{result.message}</p>
          <p className="mt-2 text-slate-400">{result.mismatchReason}</p>
        </div>
      ) : null}
    </motion.div>
  );
}
