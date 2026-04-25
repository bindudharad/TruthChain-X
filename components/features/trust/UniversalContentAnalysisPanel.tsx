"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Globe, Link2, PlayCircle, Sparkles, Type, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { api } from "@/services/api";
import { UniversalAnalysisResponse, UniversalContentMode } from "@/lib/types";

const ICONS: Record<Exclude<UniversalContentMode, "image">, typeof Type> = {
  text: Type,
  url: Link2,
  video: PlayCircle
};

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.07]" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-white/[0.05]" />
      <div className="mt-4 h-20 animate-pulse rounded-xl bg-white/[0.04]" />
    </motion.div>
  );
}

export function UniversalContentAnalysisPanel({
  mode,
  value
}: {
  mode: "text" | "url" | "video";
  value: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<UniversalAnalysisResponse | null>(null);

  const endpoint = useMemo(() => {
    if (mode === "video") return "/api/video-analysis";
    if (mode === "url") return "/api/url-analysis";
    return "/api/text-analysis";
  }, [mode]);

  useEffect(() => {
    if (!value.trim()) {
      setLoading(false);
      setError("");
      setData(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const payload = mode === "video" ? { videoUrl: value } : mode === "url" ? { url: value } : { text: value };
        const response = await api.post<UniversalAnalysisResponse>(endpoint, payload, { cache: "no-store" });
        if (!cancelled) setData(response);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Analysis failed.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [endpoint, mode, value]);

  if (!value.trim()) return null;

  const ModeIcon = ICONS[mode];

  return (
    <Card hover={false}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-100">
            <ModeIcon className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Universal Content Analysis</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-white">Live search + AI trust analysis</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            TruthChain-X is pulling public search context, scoring risk, and turning the results into a clean trust explanation for this {mode}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={loading ? "warning" : data?.verdict === "Safe" ? "success" : data?.verdict === "Suspicious" ? "warning" : "danger"}>
            {loading ? "Searching..." : data?.verdict || "Waiting"}
          </Badge>
          {data ? <Badge tone="info">{data.trustScore}/100 trust</Badge> : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3 text-sm text-cyan-100">Searching across the internet...</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <SkeletonCard key={item} index={item} />
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">{error}</div> : null}

      <AnimatePresence>
        {!loading && !error && data ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-5">
            <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trust Score</p>
                <p className="mt-3 text-5xl font-semibold text-white">{data.trustScore}<span className="text-2xl text-slate-500">/100</span></p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      data.verdict === "Safe" ? "from-emerald-400 to-green-500" : data.verdict === "Suspicious" ? "from-amber-300 to-yellow-500" : "from-rose-400 to-red-500"
                    }`}
                    style={{ width: `${data.trustScore}%` }}
                  />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{data.explanation}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2 text-cyan-100">
                  <Globe className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Signals</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} tone={/risk|warning|phishing|unverified/i.test(tag) ? "warning" : /suspicious|clickbait/i.test(tag) ? "danger" : "info"}>
                      {tag}
                    </Badge>
                  ))}
                </div>
                {data.metadata ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {Object.entries(data.metadata).map(([key, nextValue]) => (
                      <div key={key} className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="mt-2 text-sm font-medium text-white">{String(nextValue)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {data.cards.length ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {data.cards.map((card, index) => (
                  <motion.a
                    key={`${card.link}-${index}`}
                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    href={card.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:border-cyan-300/20 hover:shadow-[0_20px_50px_rgba(14,165,233,0.14)]"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <Badge tone={card.suspicious ? "danger" : card.trustScore >= 75 ? "success" : "warning"}>{card.trustScore}/100</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{card.source}</p>
                    {card.snippet ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{card.snippet}</p> : null}
                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Summary
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{card.aiSummary}</p>
                    </div>
                  </motion.a>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-5 py-10 text-center">
                <TriangleAlert className="mx-auto h-8 w-8 text-slate-500" />
                <p className="mt-4 text-lg font-semibold text-white">No matching public results found yet</p>
                <p className="mt-2 text-sm text-slate-400">This input was analyzed, but the live search layer did not return strong related sources.</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
