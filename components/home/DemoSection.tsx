"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ScanSearch } from "lucide-react";

const demoSamples = [
  {
    input: "amazon-secure-login.xyz",
    score: 18,
    verdict: "HIGH RISK",
    explanation: "Suspicious domain pattern, phishing keywords detected."
  },
  {
    input: "verify-wallet-security-now.net",
    score: 24,
    verdict: "HIGH RISK",
    explanation: "Urgency language and wallet login bait were detected."
  },
  {
    input: "updates-account-check.example-signin.com",
    score: 31,
    verdict: "SUSPICIOUS",
    explanation: "Brand impersonation pattern suggests extra caution."
  }
];

export function DemoSection() {
  const [inputValue, setInputValue] = useState(demoSamples[0].input);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(demoSamples[0]);

  useEffect(() => {
    if (!isScanning) return;

    const timer = window.setTimeout(() => {
      const next =
        demoSamples.find((sample) => inputValue.toLowerCase().includes(sample.input.split(".")[0])) || {
          input: inputValue,
          score: inputValue.toLowerCase().includes("login") || inputValue.toLowerCase().includes("secure") ? 22 : 68,
          verdict: inputValue.toLowerCase().includes("login") || inputValue.toLowerCase().includes("secure") ? "HIGH RISK" : "VERIFIED",
          explanation:
            inputValue.toLowerCase().includes("login") || inputValue.toLowerCase().includes("secure")
              ? "This URL shows signals commonly associated with phishing attempts."
              : "No immediate spoofing indicators were detected in this sample."
        };

      setResult(next);
      setIsScanning(false);
    }, 1450);

    return () => window.clearTimeout(timer);
  }, [inputValue, isScanning]);

  const progressColor = useMemo(() => {
    if (result.score <= 25) return "from-rose-500 via-orange-400 to-amber-300";
    if (result.score <= 55) return "from-amber-400 via-yellow-300 to-emerald-300";
    return "from-emerald-500 via-cyan-400 to-sky-400";
  }, [result.score]);

  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.45 }}>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Live Demo</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Try the trust engine in seconds</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
              Paste a suspicious URL, watch the scan run, and see how TruthChain-X turns technical detection into a clear decision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_28px_90px_rgba(2,6,23,0.42)]"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Paste a suspicious URL...</label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all duration-200 focus:border-cyan-400/35"
                  placeholder="Paste a suspicious URL..."
                />
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(56,189,248,0.22)] transition-all duration-200 hover:scale-[1.03]"
                >
                  <ScanSearch className="h-4 w-4" />
                  Analyze
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              {isScanning ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-cyan-100">
                    <div className="gradient-spinner" />
                    AI analyzing in real time...
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: ["12%", "48%", "76%", "100%"] }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400"
                    />
                  </div>
                  <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ) : (
                <motion.div key={`${result.input}-${result.score}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">URL</p>
                      <p className="mt-3 text-lg font-medium text-white">{result.input}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${result.score <= 25 ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : result.score <= 55 ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
                      {result.verdict}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Trust Score</p>
                      <p className="text-2xl font-semibold text-white">{result.score}/100</p>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                    <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    {result.explanation}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
