"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type NetworkNode = {
  id: string;
  label: string;
  x: string;
  y: string;
  cluster: "fake" | "watch" | "clean";
};

type NetworkEdge = {
  from: string;
  to: string;
};

const nodeStyles = {
  fake: "border-rose-400/30 bg-rose-400/18 text-rose-100",
  watch: "border-amber-400/30 bg-amber-400/16 text-amber-100",
  clean: "border-emerald-400/30 bg-emerald-400/16 text-emerald-100"
};

export function MisinformationNetworkGraph({
  nodes,
  edges
}: {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const hasNodes = nodes.length > 0;

  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className="panel panel-hover rounded-lg p-6">
      <div className="mb-4">
        <p className="text-lg font-semibold text-white">Misinformation Network Graph</p>
        <p className="text-sm text-slate-400">Connected narratives, duplicate uploads, and suspicious clusters across the trust graph.</p>
      </div>
      <div className="relative h-80 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),rgba(11,15,26,0.2)_55%)]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "36px 36px"
          }}
        />

        {!hasNodes ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-400">
            No related content cluster has formed yet. This graph will populate once the fingerprint overlaps with reposts, remixes, or creator-linked narratives.
          </div>
        ) : null}

        {edges.map((edge, index) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;
          const highlighted = activeNode && [edge.from, edge.to].includes(activeNode);

          return (
            <motion.div
              key={`${edge.from}-${edge.to}-${index}`}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: highlighted ? 0.9 : [0.18, 0.5, 0.18] }}
              transition={{ repeat: highlighted ? 0 : Infinity, duration: 2.4 + index * 0.2 }}
              className="absolute h-px origin-left bg-gradient-to-r from-cyan-400/60 to-violet-400/30"
              style={{
                left: from.x,
                top: from.y,
                width: `${Math.hypot(parseFloat(to.x) - parseFloat(from.x), parseFloat(to.y) - parseFloat(from.y)) * 3.5}px`,
                transform: `rotate(${Math.atan2(parseFloat(to.y) - parseFloat(from.y), parseFloat(to.x) - parseFloat(from.x))}rad)`
              }}
            />
          );
        })}

        {nodes.map((node, index) => (
          <motion.button
            key={node.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: activeNode === node.id ? 1.08 : 1 }}
            transition={{ delay: index * 0.06 }}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-xs shadow-[0_0_24px_rgba(14,165,233,0.08)] ${nodeStyles[node.cluster]}`}
            style={{ left: node.x, top: node.y }}
          >
            {node.label}
          </motion.button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-rose-200">Fake cluster</span>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">Watch cluster</span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">Trusted node</span>
      </div>
    </motion.div>
  );
}
