"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, ScanSearch, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { api } from "@/services/api";
import { ReverseImageSearchResponse } from "@/lib/types";

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <div className="aspect-[4/3] animate-pulse bg-white/[0.06]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
      </div>
    </motion.div>
  );
}

export function ReverseImageSearchPanel({
  imageData,
  imageUrl,
  fileName
}: {
  imageData?: string;
  imageUrl?: string;
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReverseImageSearchResponse | null>(null);

  const shouldSearch = useMemo(() => Boolean(imageData || imageUrl), [imageData, imageUrl]);

  useEffect(() => {
    if (!shouldSearch) {
      setLoading(false);
      setError("");
      setData(null);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setLoading(true);
      setError("");

      try {
        const response = await api.post<ReverseImageSearchResponse>("/api/image-search", {
          imageData,
          imageUrl
        });

        if (!cancelled) {
          setData(response);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Reverse image search failed.");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runSearch().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [imageData, imageUrl, shouldSearch]);

  if (!shouldSearch) return null;

  return (
    <Card hover={false}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-100">
            <ScanSearch className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Reverse Image Search</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-white">Visual matches across the internet</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Search results are pulled from Google Lens visual matches through SerpAPI and scored for trust signals inside TruthChain-X.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fileName ? <Badge tone="info">{fileName}</Badge> : null}
          <Badge tone={loading ? "warning" : data?.results?.length ? "success" : "neutral"}>{loading ? "Searching..." : `${data?.results.length || 0} matches`}</Badge>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3 text-sm text-cyan-100">
            Searching across the internet...
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonCard key={item} index={item} />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <AnimatePresence>
        {!loading && !error && data ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="mt-6">
            {data.note ? (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-200" />
                <p>{data.note}</p>
              </div>
            ) : null}

            {data.results.length ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.06
                    }
                  }
                }}
                className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {data.results.map((match, index) => (
                  <motion.a
                    key={`${match.link}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    href={match.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:border-cyan-300/20 hover:shadow-[0_22px_60px_rgba(14,165,233,0.14)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.thumbnail} alt={match.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Badge tone={match.suspicious ? "danger" : match.trustScore >= 75 ? "success" : "warning"}>
                          {match.trustScore}/100
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-white">{match.title}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{match.source}</p>
                      {match.snippet ? <p className="line-clamp-2 text-sm text-slate-400">{match.snippet}</p> : null}
                      <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3">
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          AI Summary
                        </div>
                        <p className="text-sm leading-6 text-slate-300">{match.aiSummary}</p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-5 py-10 text-center">
                <TriangleAlert className="mx-auto h-8 w-8 text-slate-500" />
                <p className="mt-4 text-lg font-semibold text-white">No strong public visual matches found</p>
                <p className="mt-2 text-sm text-slate-400">Try supplying the original public image URL for broader internet coverage.</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
