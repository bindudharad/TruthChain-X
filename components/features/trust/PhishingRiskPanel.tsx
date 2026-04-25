"use client";

import { LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CountUp } from "@/components/ui/CountUp";
import { SimilarityMatch } from "@/lib/types";

export function PhishingRiskPanel({
  score,
  riskLevel,
  attackType,
  reasons,
  analyzedUrl,
  similarityScore,
  similarMatches
}: {
  score: number;
  riskLevel: "safe" | "suspicious" | "dangerous";
  attackType: string;
  reasons: string[];
  analyzedUrl?: string;
  similarityScore: number;
  similarMatches: SimilarityMatch[];
}) {
  const tone = riskLevel === "dangerous" ? "danger" : riskLevel === "suspicious" ? "warning" : "success";

  return (
    <Card className="panel-subtle metric-flash p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Phishing Risk</p>
          <p className="mt-2 text-2xl font-semibold text-white">Browser threat verdict</p>
          <p className="mt-2 text-sm text-slate-400">URL and content heuristics blended with trust scoring and scam similarity lookup.</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-100">
          <ShieldAlert className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="info" className="inline-flex items-center gap-1.5">
          <LockKeyhole className="h-3.5 w-3.5" />
          Secure Processing
        </Badge>
        <Badge tone={riskLevel === "dangerous" ? "warning" : "success"} className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {riskLevel === "dangerous" ? "Heightened Review" : "AI Confidence High"}
        </Badge>
        <Badge tone="info">Blockchain Verified</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Risk Score">
          <p className="mt-3 text-2xl font-semibold capitalize text-white">
            <CountUp value={score} suffix="%" />
          </p>
        </Metric>
        <Metric label="Risk Level">
          <Badge tone={tone} className="text-sm capitalize">
            {riskLevel}
          </Badge>
        </Metric>
        <Metric label="Attack Type" value={attackType.replace(/-/g, " ")} />
      </div>

      {analyzedUrl ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Analyzed URL</p>
          <p className="mt-2 break-all text-sm text-slate-200">{analyzedUrl}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reasons</p>
          <div className="mt-3 space-y-2">
            {reasons.length ? (
              reasons.map((reason) => (
                <div key={reason} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                  {reason}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No phishing-specific reasons were raised for this input.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Scam Similarity</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            <CountUp value={similarityScore} suffix="%" />
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {similarMatches.length ? `${similarMatches.length} related suspicious entries found.` : "No strong phishing family match found."}
          </p>
          <div className="mt-4 space-y-2">
            {similarMatches.slice(0, 2).map((match) => (
              <div key={match.matchId} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{match.source}</p>
                  <Badge tone={match.similarityScore > 70 ? "danger" : "warning"}>{match.similarityScore}%</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{match.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {children || <p className="mt-3 text-2xl font-semibold capitalize text-white">{value}</p>}
    </div>
  );
}
