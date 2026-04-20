"use client";

import { motion } from "framer-motion";
import { ComparisonVisual, TrustGraphLink, ViralSignal } from "@/lib/types";

export function TrustGraphPanel({
  trustGraph,
  viralSignal,
  comparisonVisuals
}: {
  trustGraph: TrustGraphLink[];
  viralSignal: ViralSignal;
  comparisonVisuals: ComparisonVisual[];
}) {
  return (
    <div className="grid gap-6">
      <div className="panel rounded-lg p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Trust graph</p>
            <p className="text-sm text-slate-400">Semantic neighbors linked through embedding-style similarity.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{trustGraph.length} linked items</span>
        </div>
        <div className="space-y-3">
          {trustGraph.length ? (
            trustGraph.map((link) => (
              <div key={link.hash} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{link.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{link.relationship}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{link.similarity}% match</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${link.similarity}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              No strong semantic neighbors yet. This submission currently looks like a new cluster.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel rounded-lg p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Viral detection</p>
              <p className="text-sm text-slate-400">Repeated uploads and cluster velocity are tracked by hash and similarity.</p>
            </div>
            <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs text-rose-200">{viralSignal.status}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Repeat count</p>
              <p className="mt-2 text-2xl font-semibold text-white">{viralSignal.repeatCount}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trending score</p>
              <p className="mt-2 text-2xl font-semibold text-white">{viralSignal.trendingScore}%</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">{viralSignal.clusterLabel}</p>
        </div>

        <div className="panel rounded-lg p-6">
          <div className="mb-5">
            <p className="text-lg font-semibold">Comparison visuals</p>
            <p className="text-sm text-slate-400">FLUX-style prompt pack for fake-vs-real visual explainers.</p>
          </div>
          <div className="space-y-3">
            {comparisonVisuals.length ? (
              comparisonVisuals.map((visual) => (
                <div key={visual.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-slate-100">{visual.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{visual.description}</p>
                  <p className="mt-3 text-xs leading-6 text-slate-500">{visual.prompt}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                Comparison visuals are generated only when the ensemble sees enough suspicious evidence to justify them.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
