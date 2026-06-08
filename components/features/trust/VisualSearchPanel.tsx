"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Github, Globe, Image as ImageIcon, MessageSquare, Newspaper, PlayCircle, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { api } from "@/services/api";
import { VisualSearchResponse, VisualSearchResult } from "@/lib/types";

const PAGE_SIZE = 12;

function platformIcon(platform: string) {
  const value = platform.toLowerCase();
  if (value.includes("youtube")) return PlayCircle;
  if (value.includes("instagram") || value.includes("tiktok") || value.includes("pinterest")) return ImageIcon;
  if (value.includes("x") || value.includes("facebook") || value.includes("reddit")) return MessageSquare;
  if (value.includes("github")) return Github;
  if (value.includes("news") || value.includes("wikipedia")) return Newspaper;
  return Globe;
}

function providerTone(provider: VisualSearchResponse["provider"]) {
  if (provider === "mixed") return "success" as const;
  if (provider === "serpapi" || provider === "bing") return "info" as const;
  return "warning" as const;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <div className="aspect-[4/5] animate-pulse bg-white/[0.06]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
    </motion.div>
  );
}

async function fetchVisualResults(payload: { query?: string; imageData?: string; imageUrl?: string; page: number }) {
  return api.post<VisualSearchResponse>("/api/visual-search", {
    ...payload,
    pageSize: PAGE_SIZE
  });
}

export function VisualSearchPanel({
  query,
  imageData,
  imageUrl,
  fileName
}: {
  query?: string;
  imageData?: string;
  imageUrl?: string;
  fileName?: string;
}) {
  const normalizedQuery = query?.trim() || "";
  const enabled = Boolean(imageData || imageUrl || (normalizedQuery && normalizedQuery.length <= 120 && !/^https?:\/\//i.test(normalizedQuery)));
  const requestKey = useMemo(() => JSON.stringify({ normalizedQuery, imageData: Boolean(imageData), imageUrl: imageUrl || "", fileName: fileName || "" }), [fileName, imageData, imageUrl, normalizedQuery]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<VisualSearchResponse | null>(null);
  const [results, setResults] = useState<VisualSearchResult[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setLoadingMore(false);
      setError("");
      setResponse(null);
      setResults([]);
      setPage(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadingMore(false);
    setError("");
    setResults([]);
    setPage(0);

    fetchVisualResults({ query: normalizedQuery, imageData, imageUrl, page: 0 })
      .then((data) => {
        if (cancelled) return;
        setResponse(data);
        setResults(data.results);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Visual search failed.");
        setResponse(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, imageData, imageUrl, normalizedQuery, requestKey]);

  useEffect(() => {
    if (!enabled || !response?.hasMore || loading || loadingMore || !sentinelRef.current) return;
    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        setLoadingMore(true);
        fetchVisualResults({ query: normalizedQuery, imageData, imageUrl, page: page + 1 })
          .then((data) => {
            setResponse(data);
            setResults((current) =>
              [...current, ...data.results].filter(
                (item, index, all) => all.findIndex((candidate) => candidate.link === item.link || candidate.id === item.id) === index
              )
            );
            setPage((current) => current + 1);
          })
          .catch((nextError) => {
            setError(nextError instanceof Error ? nextError.message : "Unable to load more visual results.");
          })
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, imageData, imageUrl, loading, loadingMore, normalizedQuery, page, response?.hasMore]);

  if (!enabled) return null;

  return (
    <Card hover={false}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-100">
            <Search className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Visual Matches</p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Google-style visual search results</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Browse live image results with source names, thumbnails, and direct links. TruthChain-X cleans duplicates and filters obvious spam before showing them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fileName ? <Badge tone="info">{fileName}</Badge> : null}
          <Badge tone={providerTone(response?.provider || "unavailable")}>{response?.provider || "searching"}</Badge>
          <Badge tone={results.length ? "success" : "warning"}>{results.length} results</Badge>
        </div>
      </div>

      {response?.note ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          <Sparkles className="mt-0.5 h-4 w-4 text-cyan-200" />
          <p>{response.note}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">{error}</div>
      ) : null}

      {loading ? (
        <div className="mt-6 columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={index} index={index} />
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {!loading && !error && results.length ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
              {results.map((item, index) => {
                const PlatformIcon = platformIcon(item.platform);
                return (
                  <motion.a
                    key={`${item.link}-${index}`}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.24) }}
                    whileHover={{ y: -4 }}
                    className="group mb-4 block break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm transition duration-200 hover:border-cyan-300/20 hover:shadow-[0_18px_50px_rgba(14,165,233,0.16)]"
                  >
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnail} alt={item.title} loading="lazy" className="w-full object-cover transition duration-300 group-hover:scale-[1.05]" />
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <PlatformIcon className="h-3.5 w-3.5 text-cyan-200" />
                          {item.platform}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-white" />
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.source}</p>
                      {item.description ? <p className="line-clamp-2 text-sm leading-6 text-slate-400">{item.description}</p> : null}
                    </div>
                  </motion.a>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col items-center gap-4">
              {loadingMore ? (
                <div className="columns-1 w-full gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonCard key={`more-${index}`} index={index} />
                  ))}
                </div>
              ) : null}

              {response?.hasMore ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (loadingMore) return;
                      setLoadingMore(true);
                      fetchVisualResults({ query: normalizedQuery, imageData, imageUrl, page: page + 1 })
                        .then((data) => {
                          setResponse(data);
                          setResults((current) =>
                            [...current, ...data.results].filter(
                              (item, index, all) => all.findIndex((candidate) => candidate.link === item.link || candidate.id === item.id) === index
                            )
                          );
                          setPage((current) => current + 1);
                        })
                        .catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : "Unable to load more visual results.");
                        })
                        .finally(() => setLoadingMore(false));
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                  >
                    See more
                  </button>
                  <div ref={sentinelRef} className="h-1 w-full" />
                </>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!loading && !error && !results.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-5 py-10 text-center">
          <p className="text-lg font-semibold text-white">No visual matches yet</p>
          <p className="mt-2 text-sm text-slate-400">Try a more specific image or search phrase, or verify the image-search provider keys.</p>
        </div>
      ) : null}
    </Card>
  );
}
