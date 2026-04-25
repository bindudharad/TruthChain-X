"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { SimpleSpamOutput } from "@/lib/types";

function toneFromCategory(category: SimpleSpamOutput["category"]) {
  if (category === "Safe") return "success" as const;
  if (category === "Suspicious") return "warning" as const;
  return "danger" as const;
}

function barClass(color: SimpleSpamOutput["color"]) {
  if (color === "green") return "from-emerald-400 to-green-500";
  if (color === "yellow") return "from-amber-300 to-yellow-500";
  return "from-rose-400 to-red-500";
}

export function SimpleSpamOutputPanel({ result }: { result?: SimpleSpamOutput | null }) {
  if (!result) return null;

  const uniqueTags = result.tags ? Array.from(new Set(result.tags)) : [];
  const featureEntries = [
    { key: "hasSuspiciousLinks", label: "Suspicious links", active: result.features.hasSuspiciousLinks },
    { key: "hasPhishingKeywords", label: "Phishing keywords", active: result.features.hasPhishingKeywords },
    { key: "hasUrgencyWords", label: "Urgency language", active: result.features.hasUrgencyWords },
    { key: "hasViralMisinformationPattern", label: "Viral misinformation", active: result.features.hasViralMisinformationPattern },
    { key: "hasSuspiciousClaimLanguage", label: "Suspicious claim wording", active: result.features.hasSuspiciousClaimLanguage },
    { key: "requiresVerification", label: "Needs verification", active: result.features.requiresVerification }
  ];

  return (
    <Card hover={false}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-100">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Structured Spam Score</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-white">Simple output layer</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{result.reason}</p>
          {uniqueTags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {uniqueTags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} tone={/No Trusted Source|Risk|Phishing/i.test(tag) ? "danger" : /Unverified|Viral/i.test(tag) ? "warning" : "info"}>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <Badge tone={toneFromCategory(result.category)} className="text-sm">
          {result.category}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr,1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Score</p>
          <p className="mt-3 text-5xl font-semibold text-white">
            <CountUp value={result.score} /> <span className="text-2xl text-slate-500">/ 100</span>
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
            <div className={`h-full rounded-full bg-gradient-to-r ${barClass(result.color)}`} style={{ width: `${result.score}%` }} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {featureEntries.map((feature) => (
            <div key={feature.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                {feature.active ? <AlertTriangle className="h-4 w-4 text-amber-200" /> : <CheckCircle2 className="h-4 w-4 text-emerald-200" />}
                <p className="text-sm font-medium text-white">{feature.label}</p>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{feature.active ? "Detected" : "Not detected"}</p>
            </div>
          ))}
        </div>
      </div>

      {result.details?.length ? (
        <div className="mt-5 grid gap-2">
          {result.details.map((detail, index) => (
            <div key={`${detail}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
              {detail}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
