"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Image as ImageIcon, PlayCircle, QrCode, ShieldCheck, TriangleAlert } from "lucide-react";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";
import { UploadCard } from "@/components/upload/UploadCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { SimpleSpamOutputPanel } from "@/components/features/trust/SimpleSpamOutputPanel";
import { SimpleSpamOutput } from "@/lib/types";

const defaultFeatures = {
  hasSuspiciousLinks: false,
  hasUrgencyWords: false,
  hasAllCaps: false,
  hasRepeatedText: false,
  hasPhishingKeywords: false,
  hasViralMisinformationPattern: false,
  hasSuspiciousClaimLanguage: false,
  hasCredentialBait: false,
  hasCredibleSource: false,
  hasPublicFigureClaim: false,
  hasPoliticalClaim: false,
  hasHealthClaim: false,
  hasMajorEventClaim: false,
  requiresVerification: false,
};

function verdictTone(category?: string) {
  if (category === "Safe") return "success" as const;
  if (category === "Suspicious") return "warning" as const;
  return "danger" as const;
}

function scoreColor(score: number) {
  if (score <= 30) return "from-emerald-400 to-green-500";
  if (score <= 70) return "from-amber-300 to-yellow-500";
  return "from-rose-400 to-red-500";
}

function buildSimpleOutput(result: any): SimpleSpamOutput {
  const score = Number(result?.simpleOutput?.score ?? result?.score ?? result?.trustScore ?? 0);
  const category = result?.simpleOutput?.category ?? result?.category ?? (score <= 30 ? "Safe" : score <= 70 ? "Suspicious" : "Spam");
  const normalizedCategory = category === "Spam" ? "Risk" : category;

  return {
    score,
    category: normalizedCategory,
    color: result?.simpleOutput?.color ?? result?.color ?? (category === "Safe" ? "green" : category === "Suspicious" ? "yellow" : "red"),
    reason: result?.simpleOutput?.reason ?? result?.reason ?? "No suspicious patterns detected",
    features: result?.simpleOutput?.features ?? result?.features ?? defaultFeatures,
    tags: result?.simpleOutput?.tags ?? result?.tags ?? [],
    details: result?.simpleOutput?.details ?? result?.details ?? result?.reasons ?? []
  };
}

export default function AnalyzePage() {
  const [inputPreview, setInputPreview] = useState<{ mode: "text" | "image" | "video" | "url"; value: string; fileName?: string; preview?: string } | null>(null);

  return (
    <WorkspacePage title="Analysis" subtitle="Analyze URLs, text, images, and QR content with a clear trust score">
      {({ result, loading, error, verifyContent }) => {
        const simpleOutput = result ? buildSimpleOutput(result) : null;
        const score = simpleOutput?.score ?? 0;
        const category = simpleOutput?.category ?? "Safe";

        return (
          <div className="space-y-8">
            <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
              <UploadCard loading={loading} onVerify={verifyContent} onInputStateChange={setInputPreview} />

              <Card hover={false} className="rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Result</p>
                    <h1 className="mt-2 text-3xl font-semibold text-white">Trust verdict</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      Submit content to receive a score, verdict, and simple explanation. The interface stays focused on what matters most.
                    </p>
                  </div>
                  <Badge tone={loading ? "info" : verdictTone(category)}>{loading ? "Analyzing" : category}</Badge>
                </div>

                {loading ? (
                  <div className="mt-8 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-5">
                    <p className="text-sm font-medium text-cyan-100">Analyzing content...</p>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: "8%" }}
                        animate={{ width: ["18%", "58%", "100%"] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full rounded-full bg-cyan-300"
                      />
                    </div>
                  </div>
                ) : simpleOutput ? (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trust Score</p>
                      <div className="mt-3 flex flex-wrap items-end gap-3">
                        <p className="text-5xl font-semibold text-white">
                          <CountUp value={score} />
                        </p>
                        <p className="pb-2 text-lg text-slate-500">/ 100</p>
                      </div>
                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.55, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)}`}
                        />
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Badge tone={verdictTone(category)}>{category === "Risk" ? "HIGH RISK" : category.toUpperCase()}</Badge>
                        <p className="text-sm leading-6 text-slate-300">{simpleOutput.reason}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Input preview</p>
                      <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm leading-6 text-slate-300">
                        {inputPreview?.fileName || inputPreview?.value || result?.record?.sourcePreview || "Latest submitted content"}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 p-8 text-center">
                    <ShieldCheck className="mx-auto h-9 w-9 text-slate-500" />
                    <p className="mt-4 text-lg font-semibold text-white">Ready to analyze</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Your result will appear here after you click Analyze.</p>
                  </div>
                )}

                {error ? <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
              </Card>
            </section>

            {simpleOutput ? <SimpleSpamOutputPanel result={simpleOutput} /> : null}

            <HowDetectionWorks />
          </div>
        );
      }}
    </WorkspacePage>
  );
}

function HowDetectionWorks() {
  const compactExamples = [
    { title: "QR example", icon: QrCode, good: "Official QR", bad: "Hidden phishing URL" },
    { title: "Image example", icon: ImageIcon, good: "Original image", bad: "Manipulated claim image" },
    { title: "Video example", icon: PlayCircle, good: "Trusted clip", bad: "Unverified viral claim" }
  ];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">How Detection Works</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Simple examples users understand quickly</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hover={false}>
          <div className="flex items-center gap-3 text-emerald-100">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">Safe URL</p>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/8 p-4">
            <p className="break-all text-sm text-emerald-100">https://google.com</p>
            <p className="mt-3 text-2xl font-semibold text-white">94 / 100</p>
            <p className="mt-2 text-sm text-slate-300">Known domain with no suspicious login pattern.</p>
          </div>
        </Card>

        <Card hover={false}>
          <div className="flex items-center gap-3 text-rose-100">
            <TriangleAlert className="h-5 w-5" />
            <p className="font-semibold">Fake URL</p>
          </div>
          <div className="mt-4 rounded-xl border border-rose-400/15 bg-rose-400/8 p-4">
            <p className="break-all text-sm text-rose-100">amazon-secure-login.xyz</p>
            <p className="mt-3 text-2xl font-semibold text-white">18 / 100</p>
            <p className="mt-2 text-sm text-slate-300">Fake domain detected. Suspicious keywords found.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {compactExamples.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-white">{item.title}</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-2 text-emerald-100">{item.good}</div>
                <div className="rounded-xl border border-rose-400/15 bg-rose-400/8 px-3 py-2 text-rose-100">{item.bad}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
