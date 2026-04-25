"use client";

import { AlertTriangle, Image as ImageIcon, ScanEye, ShieldBan, Sparkles } from "lucide-react";
import { AIDetectionSummary, MediaAnalysisSummary, SensitiveContentSummary } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";

export function ExtendedSafetyPanel({
  aiDetection,
  mediaAnalysis,
  sensitiveContent,
  compact = false
}: {
  aiDetection?: AIDetectionSummary | null;
  mediaAnalysis?: MediaAnalysisSummary | null;
  sensitiveContent?: SensitiveContentSummary | null;
  compact?: boolean;
}) {
  const textDetection = aiDetection?.text;
  const imageDetection = aiDetection?.image;
  const imageAnalysis = mediaAnalysis?.image;
  const videoAnalysis = mediaAnalysis?.video;
  const categories = sensitiveContent?.categories || [];

  return (
    <Card className={compact ? "panel-subtle p-5" : undefined} hover={false}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Extended Analysis</p>
          <p className="mt-2 text-2xl font-semibold text-white">{compact ? "AI, media, and safety summary" : "Media, AI-generated, and sensitive-content review"}</p>
          <p className="mt-2 text-sm text-slate-400">
            Lightweight heuristics keep the demo fast while surfacing suspicious media cues, synthetic-content hints, and sensitive-content categories.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Fast Heuristics</Badge>
          <Badge tone="info">Backend-connected when data is available</Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI-Generated Detection</p>
              <p className="text-xs text-slate-500">Text and image heuristics</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Metric label="Text probability">
              <p className="mt-2 text-2xl font-semibold text-white">
                <CountUp value={textDetection?.aiGeneratedProbability || 0} suffix="%" />
              </p>
            </Metric>
            <Metric label="Image confidence">
              <p className="mt-2 text-2xl font-semibold text-white">
                <CountUp value={imageDetection?.confidence || 0} suffix="%" />
              </p>
            </Metric>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={textDetection?.isLikelyAIGenerated ? "warning" : "success"}>{textDetection?.isLikelyAIGenerated ? "AI-like text" : "Text looks human"}</Badge>
            <Badge tone={imageDetection?.aiGeneratedImage ? "warning" : "success"}>{imageDetection?.aiGeneratedImage ? "AI-like image" : "Image looks natural"}</Badge>
          </div>
          <SignalList signals={[...(textDetection?.signals || []), ...(imageDetection?.signals || [])].slice(0, 3)} emptyLabel="No synthetic-content signals were raised." />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Media Analysis</p>
              <p className="text-xs text-slate-500">Image and video cues</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={imageAnalysis?.suspicious ? "danger" : "success"}>{imageAnalysis?.suspicious ? "Suspicious image" : "Image clear"}</Badge>
            <Badge tone={videoAnalysis?.suspicious ? "danger" : "success"}>{videoAnalysis?.suspicious ? "Suspicious video" : "Video clear"}</Badge>
          </div>
          <SignalList
            signals={[...(imageAnalysis?.findings || []), ...(videoAnalysis?.findings || [])].slice(0, 4)}
            emptyLabel="No media URLs were available for analysis."
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-100">
              <ShieldBan className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Sensitive Content</p>
              <p className="text-xs text-slate-500">Scam, harmful, NSFW, and spam heuristics</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={sensitiveContent?.isSensitive ? "danger" : "success"}>{sensitiveContent?.isSensitive ? "Sensitive content detected" : "No sensitive flags"}</Badge>
            <Badge tone={sensitiveContent?.severity === "high" ? "danger" : sensitiveContent?.severity === "medium" ? "warning" : "success"}>
              {(sensitiveContent?.severity || "low").toUpperCase()}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.length ? categories.map((category, index) => <Badge key={`${category}-${index}`} tone="warning">{category}</Badge>) : <span className="text-sm text-slate-400">No categories triggered.</span>}
          </div>
          <SignalList signals={sensitiveContent?.signals || []} emptyLabel="No sensitive-content signals were detected." />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SignalList({ signals, emptyLabel }: { signals: string[]; emptyLabel: string }) {
  const safeSignals = signals.filter(Boolean);

  return (
    <div className="mt-4 space-y-2">
      {safeSignals.length ? (
        safeSignals.map((signal, index) => (
          <div key={`${signal}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
              <span>{signal}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/30 px-3 py-4 text-sm text-slate-400">
          <div className="flex items-start gap-2">
            <ScanEye className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
            <span>{emptyLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
