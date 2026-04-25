"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RadialProgress } from "@/components/charts/RadialProgress";

function TrustFingerprintCardBase({
  score,
  risk,
  credibility,
  consensus,
  matches,
  confidence
}: {
  score: number;
  risk: "low" | "medium" | "high";
  credibility: "low" | "medium" | "high";
  consensus: number;
  matches: number;
  confidence: number;
}) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const safeConsensus = Number.isFinite(consensus) ? Math.max(0, Math.min(100, consensus)) : 0;
  const safeConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0;
  const safeMatches = Number.isFinite(matches) ? Math.max(0, matches) : 0;

  return (
    <Card className="relative bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(99,102,241,0.12)_42%,rgba(9,19,31,0.26))]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Phishing Risk Signature</p>
          <p className="mt-2 text-2xl font-semibold text-white">Digital phishing profile</p>
          <p className="mt-2 text-sm text-slate-400">Reusable phishing artifact generated from AI consensus, URL heuristics, and similarity analysis.</p>
        </div>
        <Badge tone="info">Confidence {safeConfidence}%</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="justify-self-center">
          <RadialProgress value={safeScore} label="Risk Confidence" size={224} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Manipulation Risk">
            <Badge tone={risk === "high" ? "danger" : risk === "medium" ? "warning" : "success"} className="text-sm capitalize">
              {risk}
            </Badge>
          </Metric>
          <Metric label="Source Credibility">
            <Badge tone={credibility === "low" ? "danger" : credibility === "medium" ? "warning" : "success"} className="text-sm capitalize">
              {credibility}
            </Badge>
          </Metric>
          <Metric label="AI Consensus" value={`${safeConsensus}%`} />
          <Metric label="Similar Matches" value={String(safeMatches)} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {children || <p className="mt-3 text-2xl font-semibold text-white">{value}</p>}
    </div>
  );
}

export const TrustFingerprintCard = memo(TrustFingerprintCardBase);
