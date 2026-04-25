"use client";

import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { UnifiedTrustResult } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";

function toneFromColor(color: UnifiedTrustResult["color"]) {
  if (color === "green") return "success" as const;
  if (color === "yellow") return "warning" as const;
  return "danger" as const;
}

function barColor(color: UnifiedTrustResult["color"]) {
  if (color === "green") return "from-emerald-400 to-green-500";
  if (color === "yellow") return "from-amber-300 to-yellow-500";
  return "from-rose-400 to-red-500";
}

export function UnifiedTrustResultPanel({ result }: { result?: UnifiedTrustResult | null }) {
  if (!result) {
    return (
      <Card hover={false}>
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-8 text-center text-sm text-slate-400">
          Unified trust intelligence will appear after the first scan.
        </div>
      </Card>
    );
  }

  return (
    <Card hover={false} className="overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_60%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Unified Trust Intelligence</p>
            <p className="mt-2 text-3xl font-semibold text-white">Standardized threat verdict</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{result.reason}</p>
          </div>
          <Badge tone={toneFromColor(result.color)} className="text-sm">{result.category}</Badge>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.75fr,1.25fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Score</p>
            <p className="mt-3 text-5xl font-semibold text-white">
              <CountUp value={result.score} /> <span className="text-2xl text-slate-500">/ 100</span>
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor(result.color)} transition-all duration-300`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniScore label="Safe" value={result.safeScore} tone="safe" />
              <MiniScore label="Risk" value={result.unsafeScore} tone="risk" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReasonBlock
              title={`Safe (${result.safeScore}%)`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-200" />}
              empty="No positive safety reasons were detected."
              reasons={result.safeReasons}
              tone="safe"
            />
            <ReasonBlock
              title={`Risk (${result.unsafeScore}%)`}
              icon={<XCircle className="h-4 w-4 text-rose-200" />}
              empty="No unsafe reasons were detected."
              reasons={result.unsafeReasons}
              tone="risk"
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-cyan-100" />
            <p className="text-sm font-semibold text-white">Extracted features</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.features.length ? (
              result.features.map((feature) => (
                <Badge key={feature.id} tone={feature.polarity === "unsafe" ? "warning" : "success"}>
                  {feature.label} {feature.weight > 0 ? `+${feature.weight}` : feature.weight}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-400">No weighted risk features were extracted.</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniScore({ label, value, tone }: { label: string; value: number; tone: "safe" | "risk" }) {
  return (
    <div className={`rounded-xl border p-3 ${tone === "safe" ? "border-emerald-400/20 bg-emerald-400/10" : "border-rose-400/20 bg-rose-400/10"}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}%</p>
    </div>
  );
}

function ReasonBlock({
  title,
  icon,
  reasons,
  empty,
  tone
}: {
  title: string;
  icon: React.ReactNode;
  reasons: string[];
  empty: string;
  tone: "safe" | "risk";
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "safe" ? "border-emerald-400/15 bg-emerald-400/[0.06]" : "border-rose-400/15 bg-rose-400/[0.06]"}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="space-y-2">
        {reasons.length ? (
          reasons.map((reason) => (
            <div key={reason} className="rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-200">
              {reason}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 bg-slate-950/30 px-3 py-4 text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </div>
  );
}
