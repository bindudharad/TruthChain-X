"use client";

import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { VerificationRecord } from "@/lib/types";

type VerifyResponse = {
  verified: boolean;
  record: VerificationRecord | null;
};

export function VerificationLookup() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!text.trim()) return;
    setLoading(true);
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", content: text })
    });
    const data = (await response.json()) as VerifyResponse;
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Re-verify content</p>
          <p className="text-sm text-slate-400">Paste previously checked content to match the stored blockchain proof.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-slate-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-12 flex-1 rounded-lg border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
          placeholder="Paste text to check whether it was verified before..."
        />
        <button
          onClick={handleLookup}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 text-sm font-medium text-white transition hover:scale-[1.02] disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "Checking..." : "Find Match"}
        </button>
      </div>
      {result ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          {result.verified && result.record ? (
            <>
              <p className="font-medium text-emerald-200">Previously verified</p>
              <p className="mt-2">{result.record.explanation}</p>
              <p className="mt-3 text-xs text-slate-500">Original score: {result.record.truthScore}%</p>
            </>
          ) : (
            <p className="text-amber-200">No matching verification was found for this exact content hash.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
