"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Flag, Layers3, Search, ShieldAlert, Siren } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { SimilarityMatch, SimilarityPlatform } from "@/lib/types";
import { demoSamples } from "@/lib/sample-data";

type SearchResponse = {
  queryHash: string;
  platforms: SimilarityPlatform[];
  results: SimilarityMatch[];
};

type MatchesResponse = {
  matches: SimilarityMatch[];
};

function tone(source: SimilarityPlatform) {
  if (source === "TruthChain") return "success";
  if (source === "Telegram" || source === "X") return "warning";
  return "info";
}

function dedupeMatches(matches: SimilarityMatch[]) {
  const seen = new Map<string, SimilarityMatch>();
  for (const match of matches) {
    const key = `${match.matchId}::${match.preview}::${match.url}`;
    if (!seen.has(key)) {
      seen.set(key, match);
    }
  }
  return Array.from(seen.values());
}

export function SimilarityExplorerPage({ initialMatches = [] }: { initialMatches?: SimilarityMatch[] }) {
  const [query, setQuery] = useState(demoSamples.text);
  const [type, setType] = useState<"text" | "image">("text");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimilarityMatch[]>(initialMatches);
  const [platforms, setPlatforms] = useState<SimilarityPlatform[]>(Array.from(new Set(initialMatches.flatMap((item) => item.platforms))));
  const [selected, setSelected] = useState<SimilarityMatch | null>(initialMatches[0] || null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .get<MatchesResponse>("/api/similarity/matches")
      .then((data) => {
        const nextMatches = dedupeMatches(data.matches?.length ? data.matches : initialMatches);
        setResults(nextMatches);
        setPlatforms(Array.from(new Set(nextMatches.flatMap((item) => item.platforms))));
        setSelected((current) => current || nextMatches[0] || null);
      })
      .catch(() => {
        const nextMatches = dedupeMatches(initialMatches);
        setResults(nextMatches);
        setPlatforms(Array.from(new Set(nextMatches.flatMap((item) => item.platforms))));
        setSelected((current) => current || nextMatches[0] || null);
      });
  }, [initialMatches]);

  async function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await api.post<SearchResponse>("/api/similarity/search", {
        content: query,
        type,
        demoMode: true
      });
      const nextResults = dedupeMatches(data.results || []);
      setResults(nextResults);
      setPlatforms(Array.from(new Set((data.platforms || nextResults.flatMap((item) => item.platforms)))));
      setSelected(nextResults[0] || dedupeMatches(initialMatches)[0] || null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to run similarity search.");
      if (!results.length && initialMatches.length) {
        const nextMatches = dedupeMatches(initialMatches);
        setResults(nextMatches);
        setPlatforms(Array.from(new Set(nextMatches.flatMap((item) => item.platforms))));
        setSelected(nextMatches[0] || null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReport(match: SimilarityMatch, action: "report" | "takedown") {
    const endpoint = action === "report" ? "/api/similarity/report" : "/api/similarity/takedown";
    try {
      const response = await api.post<{ statusMessage: string }>(endpoint, {
        contentId: match.matchId,
        hash: match.matchId,
        reason: "Analyst flagged this as fraudulent or misleading.",
        userId: "demo-user",
        platform: match.source
      });
      setStatus(response.statusMessage);
      setResults((current) =>
        current.map((item) =>
          item.matchId === match.matchId
            ? {
                ...item,
                reportCount: item.reportCount + 1,
                severity: item.reportCount + 1 > 4 ? "high" : item.reportCount + 1 > 1 ? "medium" : item.severity
              }
            : item
        )
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Action failed.");
    }
  }

  const platformSummary = useMemo(() => Array.from(new Set(results.flatMap((item) => item.platforms))), [results]);

  return (
    <AppShell title="Similarity Search" subtitle="Reverse-search style matching across platforms, narratives, and fraud variants">
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <Card>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">GSDFR</p>
              <p className="mt-2 text-3xl font-semibold text-white">Global Similarity Detection & Fraud Reporting</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Search for duplicate or modified content across simulated platforms, rank the matches, and escalate fraud reports in one workflow.
              </p>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
                {(["text", "image"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setType(value);
                      setQuery(value === "text" ? demoSamples.text : demoSamples.imagePrompt);
                    }}
                    className={`rounded-lg px-3 py-2 capitalize transition ${type === value ? "bg-cyan-400/14 text-cyan-100" : "text-slate-400"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-36 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/30"
                placeholder="Paste text, caption, or an image descriptor..."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={loading || !query.trim()}>
                  <Search size={16} />
                  {loading ? "Searching..." : "Find Similar Content"}
                </Button>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                  {platformSummary.length ? `Appears on: ${platformSummary.join(", ")}` : "Run a search to see cross-platform occurrences."}
                </div>
              </div>
            </form>
            {status ? <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">{status}</div> : null}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Cross-Platform View</p>
                <p className="text-sm text-slate-400">Occurrence summary for the active match cluster.</p>
              </div>
              <Badge tone="info">{results.length} results</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(platforms.length ? platforms : platformSummary).map((platform) => (
                <div key={platform} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{platform}</p>
                    <Layers3 size={16} className="text-cyan-100" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {results.filter((item) => item.platforms.includes(platform)).length || 1} occurrence{results.filter((item) => item.platforms.includes(platform)).length === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-400/8 p-4">
              <p className="text-sm leading-7 text-slate-300">
                Mutation thresholds: above 85% is treated as highly similar, while 65-85% is treated as a modified version worth extra review.
              </p>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.length ? (
              results.map((match) => (
                <motion.button
                  key={match.matchId}
                  whileHover={{ y: -4, scale: 1.01 }}
                  type="button"
                  onClick={() => setSelected(match)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20 hover:shadow-[0_18px_40px_rgba(8,145,178,0.12)]"
                >
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/12 via-slate-900/80 to-violet-400/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge tone={tone(match.source)}>{match.source}</Badge>
                      <Badge tone={match.similarityScore > 85 ? "danger" : match.similarityScore > 65 ? "warning" : "info"}>
                        {match.similarityScore}%
                      </Badge>
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-200">{match.preview}</p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">{match.caption}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Trust {match.trustScore}%</span>
                    <span>{match.reportCount} reports</span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-12 text-center text-sm text-slate-400">
                No similarity results yet. Use the demo query above or run a scan from the Analyze page to populate this workspace.
              </div>
            )}
          </div>

          <Card>
            <div className="mb-4">
              <p className="text-lg font-semibold text-white">Result Details</p>
              <p className="text-sm text-slate-400">Click any result card to inspect source, similarity strength, and fraud actions.</p>
            </div>
            {selected ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={tone(selected.source)}>{selected.source}</Badge>
                    <Badge tone={selected.similarityScore > 85 ? "danger" : selected.similarityScore > 65 ? "warning" : "info"}>
                      {selected.similarityScore > 85 ? "Highly similar" : selected.similarityScore > 65 ? "Modified version" : "Related"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-200">{selected.matchedContent}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trust Score</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{selected.trustScore}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reports</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{selected.reportCount}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.platforms.map((platform) => (
                    <span key={platform} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                      {platform}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="h-10 px-3 text-xs" onClick={() => handleReport(selected, "report")}>
                    <Flag size={14} />
                    Report
                  </Button>
                  <Button className="h-10 px-3 text-xs" onClick={() => handleReport(selected, "takedown")}>
                    <Siren size={14} />
                    Send Takedown
                  </Button>
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                  >
                    <ExternalLink size={14} />
                    View Source
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-12 text-center">
                <ShieldAlert className="mx-auto h-6 w-6 text-cyan-100" />
                <p className="mt-4 text-sm text-slate-400">Select a result to inspect it in detail.</p>
              </div>
            )}
          </Card>
        </section>

        <AnimatePresence>
          {selected ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1A] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{selected.caption}</p>
                    <p className="text-sm text-slate-400">Source: {selected.source}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                    Close
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm leading-7 text-slate-200">{selected.matchedContent}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Similarity</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selected.similarityScore}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trust</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selected.trustScore}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reports</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selected.reportCount}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
