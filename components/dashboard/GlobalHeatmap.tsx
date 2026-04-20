"use client";

import { motion } from "framer-motion";

type HeatRegion = {
  region: string;
  x: string;
  y: string;
  intensity: number;
};

export function GlobalHeatmap({ regions }: { regions: HeatRegion[] }) {
  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className="panel panel-hover rounded-lg p-6">
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Global Heatmap</p>
        <p className="text-sm text-slate-400">Live geo-intelligence layer showing where suspicious content is spreading fastest.</p>
      </div>
      <div className="relative h-80 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),rgba(11,15,26,0.15)_58%)]">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute inset-6 rounded-[999px] border border-white/5 opacity-40" />
        <div className="absolute inset-x-10 top-1/2 h-px bg-white/5" />
        <div className="absolute inset-y-12 left-1/2 w-px bg-white/5" />
        {regions.map((region) => (
          <motion.div
            key={region.region}
            animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 2.2 + region.intensity / 50 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400"
            style={{
              left: region.x,
              top: region.y,
              width: `${10 + region.intensity / 8}px`,
              height: `${10 + region.intensity / 8}px`,
              boxShadow: `0 0 ${14 + region.intensity / 2}px rgba(244,63,94,0.45)`
            }}
            title={`${region.region}: ${region.intensity}%`}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {regions.map((region) => (
          <div key={region.region} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            {region.region} · {region.intensity}% spread risk
          </div>
        ))}
      </div>
    </motion.div>
  );
}
