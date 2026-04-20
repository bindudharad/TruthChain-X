"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

type Props = {
  content: string;
  signals: string[];
  type: "text" | "image" | "video";
};

function AIExplanationVisualizerBase({ content, signals, type }: Props) {
  const keywords = useMemo(
    () =>
      Array.from(
        new Set(
          signals
            .flatMap((signal) => signal.toLowerCase().split(/[^a-z0-9]+/))
            .filter((token) => token.length > 4)
            .slice(0, 8)
        )
      ),
    [signals]
  );

  const highlighted = useMemo(() => {
    const regex = keywords.length ? new RegExp(`(${keywords.join("|")})`, "gi") : null;
    return regex ? content.split(regex) : [content];
  }, [content, keywords]);

  const reasoningNodes = [
    { label: "Input", tone: "text-cyan-100 border-cyan-400/20 bg-cyan-400/10" },
    { label: "Risk Signals", tone: "text-amber-100 border-amber-400/20 bg-amber-400/10" },
    { label: "Model Consensus", tone: "text-violet-100 border-violet-400/20 bg-violet-400/10" },
    { label: "Trust Verdict", tone: "text-emerald-100 border-emerald-400/20 bg-emerald-400/10" }
  ];

  const hasTextContent = content.trim().length > 0;
  const visualRegions =
    type === "image"
      ? [
          { left: "18%", top: "20%", width: "24%", height: "18%", label: "Lighting inconsistency" },
          { left: "58%", top: "44%", width: "18%", height: "20%", label: "Artifact concentration" }
        ]
      : [
          { left: "20%", top: "18%", width: "22%", height: "16%", label: "Frame drift" },
          { left: "56%", top: "48%", width: "20%", height: "18%", label: "Compression anomaly" }
        ];

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">AI Explanation Visualizer</p>
        <p className="text-sm text-slate-400">Highlights suspicious evidence, estimated forensic regions, and the reasoning path behind the final trust verdict.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">Suspicious content highlights</p>
            {hasTextContent ? (
              <p className="text-sm leading-7 text-slate-300">
                {highlighted.map((part, index) => {
                  const isHot = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
                  return isHot ? (
                    <span key={`${part}-${index}`} className="rounded bg-rose-400/12 px-1 py-0.5 text-rose-100">
                      {part}
                    </span>
                  ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                  );
                })}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                No text excerpt is available for inline highlighting. The explanation is leaning on vision signals, metadata, and prior trust history instead.
              </div>
            )}
          </div>

          {type !== "text" ? (
            <div className="relative h-52 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(148,163,184,0.08),rgba(15,23,42,0.35))]">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />
              {visualRegions.map((region, index) => (
                <motion.div
                  key={`${region.left}-${index}`}
                  animate={{ opacity: [0.35, 0.9, 0.35] }}
                  transition={{ repeat: Infinity, duration: 1.8 + index * 0.4 }}
                  className="absolute rounded-lg border border-rose-400/40 bg-rose-400/10 shadow-[0_0_18px_rgba(244,63,94,0.18)]"
                  style={region}
                >
                  <span className="absolute -bottom-7 left-0 text-[10px] uppercase tracking-[0.18em] text-rose-100/80">{region.label}</span>
                </motion.div>
              ))}
              <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                Estimated forensic hotspots
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-slate-500">Reasoning graph</p>
          <div className="space-y-4">
            {reasoningNodes.map((node, index) => (
              <div key={node.label} className="relative">
                {index < reasoningNodes.length - 1 ? <div className="absolute left-5 top-10 h-8 w-px bg-white/10" /> : null}
                <div className="flex items-center gap-3">
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.08 }} className={`rounded-full border px-4 py-2 text-sm ${node.tone}`}>
                    {node.label}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
            {signals.length
              ? `Top reasoning factors: ${signals.slice(0, 3).join(", ")}.`
              : "No single high-risk phrase dominated the analysis, so the explanation is leaning more heavily on model consensus and provenance signals."}
          </div>
        </div>
      </div>
    </Card>
  );
}

export const AIExplanationVisualizer = memo(AIExplanationVisualizerBase);
