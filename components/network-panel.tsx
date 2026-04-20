"use client";

import { motion } from "framer-motion";
import { TrustGraphLink } from "@/lib/types";

export function NetworkPanel({ links }: { links: TrustGraphLink[] }) {
  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold">Misinformation network</p>
        <p className="text-sm text-slate-400">A lightweight network view of related suspicious narratives and content DNA overlap.</p>
      </div>
      <div className="grid gap-4">
        <div className="flex items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),rgba(11,15,26,0.1)_52%)] p-8">
          <div className="relative h-56 w-full max-w-md">
            <motion.div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/30 bg-cyan-400/15" />
            {links.slice(0, 4).map((link, index) => {
              const positions = [
                { left: "12%", top: "18%" },
                { left: "72%", top: "16%" },
                { left: "14%", top: "68%" },
                { left: "74%", top: "70%" }
              ][index];
              return (
                <div key={link.hash}>
                  <div className="absolute left-1/2 top-1/2 h-px w-32 -translate-y-1/2 bg-gradient-to-r from-cyan-400/40 to-transparent" style={{ transformOrigin: "left center", transform: `translateY(-50%) rotate(${index * 90}deg)` }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={positions}
                    className="absolute rounded-full border border-violet-400/25 bg-violet-400/12 px-3 py-2 text-xs text-slate-100"
                  >
                    {link.similarity}%
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2">
          {links.length ? (
            links.map((link) => (
              <div key={link.hash} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {link.label} · {link.relationship}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">No strong connected misinformation nodes yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
