"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Link2,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";
import { UploadCard } from "@/components/upload/UploadCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";

type DetailCard = {
  id: string;
  icon: typeof Globe;
  label: string;
  value: string;
  detail: string;
  tone: "safe" | "risk" | "neutral";
};

type GridItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  image: string;
  description: string;
  meta?: string;
};

type AnalysisResultView = {
  score: number;
  verdict: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
  confidence: number;
  summary: string;
  safeSignals: string[];
  risks: string[];
  detailCards: DetailCard[];
  reports: GridItem[];
  similarity: GridItem[];
};

const loadingLabel = "Analyzing...";

function toVerdict(score: number): AnalysisResultView["verdict"] {
  if (score <= 30) return "SAFE";
  if (score <= 70) return "SUSPICIOUS";
  return "HIGH RISK";
}

function verdictTone(verdict: AnalysisResultView["verdict"]) {
  if (verdict === "SAFE") return "success" as const;
  if (verdict === "SUSPICIOUS") return "warning" as const;
  return "danger" as const;
}

function toneClass(tone: DetailCard["tone"]) {
  if (tone === "safe") return "bg-emerald-400/10 text-emerald-100";
  if (tone === "risk") return "bg-rose-400/10 text-rose-100";
  return "bg-white/[0.05] text-slate-200";
}

function ringStroke(score: number) {
  if (score >= 85) return "#6ee7b7";
  if (score >= 40) return "#fcd34d";
  return "#fb7185";
}

function getScoreTheme(score: number) {
  if (score >= 85) {
    return {
      kind: "safe" as const,
      tint: "rgba(34, 197, 94, 0.05)",
      glow: "rgba(34, 197, 94, 0.2)",
      border: "rgba(34, 197, 94, 0.14)"
    };
  }

  if (score >= 40) {
    return {
      kind: "neutral" as const,
      tint: "rgba(255, 255, 255, 0.02)",
      glow: "rgba(34, 211, 238, 0.12)",
      border: "rgba(255, 255, 255, 0.08)"
    };
  }

  return {
    kind: "risk" as const,
    tint: "rgba(239, 68, 68, 0.05)",
    glow: "rgba(239, 68, 68, 0.2)",
    border: "rgba(239, 68, 68, 0.14)"
  };
}

function hostnameOf(value?: string) {
  if (!value) return "N/A";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeGridItems(items: any[], fallbackMeta?: (item: any) => string | undefined): GridItem[] {
  return items
    .map((item, index) => {
      const url = item?.url || item?.link || "#";
      const source = item?.source || item?.platform || hostnameOf(url);
      return {
        id: item?.id || item?.matchId || `${url}-${index}`,
        title: item?.title || item?.source || "Result",
        source,
        url,
        image: item?.image || item?.thumbnail || "",
        description: item?.description || item?.snippet || item?.summary || item?.caption || "External result returned by the verification layer.",
        meta: fallbackMeta?.(item)
      };
    })
    .filter((item) => item.url && item.title);
}

function normalizeResult(result: any): AnalysisResultView | null {
  if (!result) return null;

  const score = Number(result?.simpleOutput?.score ?? result?.score ?? result?.trustScore ?? 0);
  const confidence = Number(result?.confidence ?? result?.record?.confidence ?? Math.max(55, 100 - Math.abs(50 - score)));
  const summary = String(
    result?.simpleOutput?.reason ??
      result?.reason ??
      result?.record?.summary ??
      (score === 0 ? "No analyzable content detected." : "Trust analysis completed.")
  );
  const features = result?.simpleOutput?.features ?? result?.features ?? {};
  const details = asList(result?.simpleOutput?.details ?? result?.details ?? result?.reasons);
  const verdict = toVerdict(score);

  const safeSignals = [
    !features?.hasSuspiciousLinks ? "Trusted Links" : null,
    !features?.hasPhishingKeywords ? "Clean Language" : null,
    features?.hasCredibleSource ? "Known Source" : null,
    result?.record?.domainSignals?.isTrustedDomain ? "Trusted Domain" : null,
    result?.record?.sslSignals?.valid ? "SSL Active" : null
  ].filter(Boolean) as string[];

  const risks = [
    features?.hasSuspiciousLinks ? "Link Risk" : null,
    features?.hasPhishingKeywords ? "Keyword Risk" : null,
    features?.hasUrgencyWords ? "Urgency Risk" : null,
    features?.requiresVerification ? "Needs Verification" : null,
    result?.record?.domainSignals?.newDomain ? "New Domain" : null,
    result?.record?.sslSignals?.valid === false ? "SSL Weak" : null
  ].filter(Boolean) as string[];

  const reports = normalizeGridItems(
    [
      ...(result?.sources?.cards ?? []),
      ...(result?.factCheck?.articles ?? []),
      ...(result?.claimVerification?.trustedSources ?? [])
    ],
    () => undefined
  ).slice(0, 8);

  const similarity = normalizeGridItems(
    result?.similarMatches ?? result?.matches ?? result?.similarities ?? [],
    (item) => {
      const raw = item?.similarityScore ?? item?.matchPercentage ?? item?.trustScore;
      return raw != null ? `${Math.round(Number(raw))}% match` : undefined;
    }
  ).slice(0, 8);

  const detailCards: DetailCard[] = [
    {
      id: "domain",
      icon: Globe,
      label: "Domain",
      value: hostnameOf(result?.analyzedUrl || result?.url || result?.record?.sourceUrl),
      detail:
        result?.record?.domainSignals?.summary ||
        details.find((item) => item.toLowerCase().includes("domain")) ||
        "Domain checks look at reputation, age, and consistency with known destinations.",
      tone: result?.record?.domainSignals?.isTrustedDomain ? "safe" : result?.record?.domainSignals?.newDomain ? "risk" : "neutral"
    },
    {
      id: "links",
      icon: Link2,
      label: "Links",
      value: features?.hasSuspiciousLinks ? "Flagged" : "Clean",
      detail:
        details.find((item) => item.toLowerCase().includes("link")) ||
        (features?.hasSuspiciousLinks
          ? "One or more links triggered trust checks for destination, shortening, or spoofing."
          : "No obvious risky link behavior was detected."),
      tone: features?.hasSuspiciousLinks ? "risk" : "safe"
    },
    {
      id: "ssl",
      icon: Lock,
      label: "SSL",
      value: result?.record?.sslSignals?.valid === false ? "Weak" : "Secure",
      detail:
        result?.record?.sslSignals?.summary ||
        "SSL signals help verify encrypted delivery and whether the destination behaves like a legitimate site.",
      tone: result?.record?.sslSignals?.valid === false ? "risk" : "safe"
    },
    {
      id: "risks",
      icon: AlertTriangle,
      label: "Risks",
      value: risks.length ? `${risks.length} Found` : "Low",
      detail: risks.length ? risks.join(", ") : "No high-priority risk signals were found in this scan.",
      tone: risks.length ? "risk" : "safe"
    },
    {
      id: "ai",
      icon: Brain,
      label: "AI",
      value: verdict,
      detail: summary,
      tone: verdict === "SAFE" ? "safe" : verdict === "SUSPICIOUS" ? "neutral" : "risk"
    }
  ];

  return {
    score,
    verdict,
    confidence,
    summary,
    safeSignals,
    risks,
    detailCards,
    reports,
    similarity
  };
}

export default function AnalyzePage() {
  const [activeDetail, setActiveDetail] = useState<DetailCard | null>(null);
  const [activeGrid, setActiveGrid] = useState<"reports" | "similarity">("reports");

  return (
    <WorkspacePage title="Analysis" subtitle="Minimal trust analysis with clean scoring and optional drill-down details.">
      {({ result, loading, error, verifyContent }) => {
        const analysisResult = useMemo(() => normalizeResult(result), [result]);

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="space-y-8"
          >
            <section className="space-y-4">
              <SectionLabel label="Input" />
              <UploadCard loading={loading} onVerify={verifyContent} />
            </section>

            <section className="space-y-4">
              <SectionLabel label="Result" />
              {loading ? <MinimalLoader /> : <ResultCenter result={analysisResult} />}
              {error ? <ErrorNotice error={error} /> : null}
            </section>

            <section className="space-y-4">
              <SectionLabel label="Details" />
              <DetailSection
                result={analysisResult}
                activeGrid={activeGrid}
                onGridChange={setActiveGrid}
                onOpenDetail={setActiveDetail}
              />
            </section>

            <AnimatePresence>
              {activeDetail ? <DetailModal card={activeDetail} onClose={() => setActiveDetail(null)} /> : null}
            </AnimatePresence>
          </motion.div>
        );
      }}
    </WorkspacePage>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">{label}</p>;
}

function MinimalLoader() {
  return (
    <Card hover={false} className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-10 backdrop-blur-xl">
      <div className="flex min-h-[220px] flex-col items-center justify-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-full border border-white/10 bg-white/[0.03] p-1">
          <motion.div
            initial={{ x: "-30%" }}
            animate={{ x: "130%" }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "easeInOut" }}
            className="h-1.5 w-2/5 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0),rgba(34,211,238,0.95),rgba(139,92,246,0.9),rgba(139,92,246,0))]"
          />
        </div>
        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-cyan-200">
          <ScanSearch className="h-7 w-7" />
        </div>
        <p className="mt-6 text-lg font-medium text-white">{loadingLabel}</p>
        <p className="mt-2 text-sm text-slate-400">Scanning securely</p>
      </div>
    </Card>
  );
}

function ResultCenter({ result }: { result: AnalysisResultView | null }) {
  if (!result) {
    return (
      <Card hover={false} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-10 backdrop-blur-xl">
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <ShieldCheck className="h-10 w-10 text-cyan-200" />
          <p className="mt-5 text-2xl font-semibold text-white">Run a scan to see the result</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">We keep the center panel focused: score, verdict, confidence. Details appear only when you ask for them.</p>
        </div>
      </Card>
    );
  }

  const circumference = 2 * Math.PI * 64;
  const offset = circumference - (result.score / 100) * circumference;
  const theme = getScoreTheme(result.score);

  return (
    <Card hover={false} className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-transparent p-0 backdrop-blur-xl">
      <div
        className="relative rounded-[28px] p-8 transition-all duration-300 ease-in-out"
        style={{
          border: `1px solid ${theme.border}`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), linear-gradient(180deg, ${theme.tint}, rgba(255,255,255,0))`,
          boxShadow: `0 16px 48px rgba(2, 6, 23, 0.24), 0 0 0 1px ${theme.border} inset`
        }}
      >
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 18%, ${theme.tint}, rgba(255,255,255,0) 46%)`
        }}
      />
      <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
        <div className="flex justify-center">
          <div className="relative h-[220px] w-[220px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: [0, 0.85, 0.58], scale: [0.96, 1.04, 1] }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute inset-8 rounded-full blur-3xl transition-all duration-300 ease-in-out"
              style={{ backgroundColor: theme.glow }}
            />
            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
              <circle cx="90" cy="90" r="64" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <motion.circle
                cx="90"
                cy="90"
                r="64"
                fill="none"
                stroke={ringStroke(result.score)}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ strokeDasharray: circumference }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-semibold text-white">
                <CountUp value={result.score} />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">Trust Score</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={verdictTone(result.verdict)}>{result.verdict}</Badge>
            <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300">
              {result.confidence}% confidence
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard icon={ShieldCheck} label="Score" value={`${result.score}/100`} />
            <MetricCard icon={Sparkles} label="Verdict" value={result.verdict} />
            <MetricCard icon={CheckCircle2} label="Confidence" value={`${result.confidence}%`} />
          </div>

          <div className="flex flex-wrap gap-2">
            {result.safeSignals.slice(0, 3).map((signal) => (
              <SignalPill key={signal} icon="safe" label={signal} />
            ))}
            {result.risks.slice(0, 3).map((signal) => (
              <SignalPill key={signal} icon="risk" label={signal} />
            ))}
          </div>
        </div>
      </div>
      </div>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 shadow-[0_8px_24px_rgba(2,6,23,0.16)] backdrop-blur-[10px]"
    >
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4 text-cyan-200" />
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </motion.div>
  );
}

function SignalPill({ icon, label }: { icon: "safe" | "risk"; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
        icon === "safe" ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100"
      }`}
    >
      {icon === "safe" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function DetailSection({
  result,
  activeGrid,
  onGridChange,
  onOpenDetail
}: {
  result: AnalysisResultView | null;
  activeGrid: "reports" | "similarity";
  onGridChange: (value: "reports" | "similarity") => void;
  onOpenDetail: (card: DetailCard) => void;
}) {
  if (!result) {
    return (
      <Card hover={false} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
        <p className="text-sm text-slate-400">Details stay hidden until a result exists.</p>
      </Card>
    );
  }

  const activeItems = activeGrid === "reports" ? result.reports : result.similarity;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {result.detailCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => onOpenDetail(card)}
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.05] p-4 text-left shadow-[0_8px_24px_rgba(2,6,23,0.14)] backdrop-blur-[10px] transition-all duration-200 ease-in-out hover:bg-white/[0.06] hover:shadow-[0_18px_36px_rgba(14,165,233,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">{card.label}</p>
              <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${toneClass(card.tone)}`}>{card.value}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">View Details</p>
            </motion.button>
          );
        })}
      </div>

      <div className="rounded-[28px] bg-white/[0.04] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-black/20 p-1">
            <GridToggle label="Reports" active={activeGrid === "reports"} onClick={() => onGridChange("reports")} />
            <GridToggle label="Similarity" active={activeGrid === "similarity"} onClick={() => onGridChange("similarity")} />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Click any card to open source</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activeItems.length ? (
            activeItems.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.24, ease: "easeInOut" }}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.05] shadow-[0_8px_24px_rgba(2,6,23,0.14)] backdrop-blur-[10px] transition-all duration-200 ease-in-out hover:bg-white/[0.06] hover:shadow-[0_18px_36px_rgba(14,165,233,0.12)]"
              >
                <div className="flex h-32 items-center justify-center bg-slate-950/50">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : activeGrid === "reports" ? (
                    <Globe className="h-6 w-6 text-slate-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">{item.source}</p>
                  <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                  <p className="line-clamp-2 text-sm text-slate-400">{item.description}</p>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-slate-500">{item.meta || "Open"}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </motion.a>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-4 rounded-[24px] bg-black/20 p-6 text-sm text-slate-400">
              No {activeGrid} available for this result yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GridToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </motion.button>
  );
}

function DetailModal({ card, onClose }: { card: DetailCard; onClose: () => void }) {
  const Icon = card.icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.24, ease: "easeInOut" }}
        className="w-full max-w-lg rounded-[28px] border border-white/[0.08] bg-[rgba(11,15,26,0.92)] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.55)] backdrop-blur-[10px]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-100">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">{card.label}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{card.value}</h3>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-300">{card.detail}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl bg-white/[0.06] px-4 py-2 text-sm text-white transition hover:bg-white/[0.1]">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ErrorNotice({ error }: { error: string }) {
  return <div className="rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>;
}
