"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { ExternalLink, Flag, Search, ShieldAlert, Siren, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { SimilarityMatch, SimilarityPlatform } from "@/lib/types";

type SearchResponse = {
  queryHash: string;
  platforms: SimilarityPlatform[];
  results: SimilarityMatch[];
};

function platformTone(source: SimilarityPlatform) {
  if (source === "TruthChain") return "success";
  if (source === "Telegram" || source === "X") return "warning";
  return "info";
}

function SimilaritySearchPanelBase({
  hash,
  type,
  content,
  demoMode
}: {
  hash: string;
  type: "text" | "image" | "video";
  content: string;
  demoMode?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [platforms, setPlatforms] = useState<SimilarityPlatform[]>([]);
  const [status, setStatus] = useState("");
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .post<SearchResponse>("/api/similarity/search", {
        currentHash: hash,
        type,
        content,
        demoMode
      })
      .then((data) => {
        setMatches(data.results || []);
        setPlatforms(data.platforms || []);
      })
      .catch(() => {
        setMatches([]);
        setPlatforms([]);
      })
      .finally(() => setLoading(false));
  }, [content, demoMode, hash, type]);

  const foundOnMultiplePlatforms = platforms.length > 1;
  const topMatch = matches[0];

  async function handleReport(match: SimilarityMatch, action: "report" | "takedown") {
    setBusyMatchId(match.matchId);
    try {
      const endpoint = action === "report" ? "/api/similarity/report" : "/api/similarity/takedown";
      const data = await api.post<{ statusMessage: string }>(endpoint, {
        contentId: match.matchId,
        hash,
        reason: action === "report" ? "Reported by analyst as fake or misleading content." : undefined,
        platform: match.source
      });
      setStatus(data.statusMessage);
      setMatches((current) =>
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
      setStatus(error instanceof Error ? error.message : "Unable to log the report.");
    } finally {
      setBusyMatchId(null);
    }
  }

  const summaryLabel = useMemo(() => {
    if (!topMatch) return "No strong cross-platform duplicate found yet.";
    return `${topMatch.similarityScore}% match on ${topMatch.source}`;
  }, [topMatch]);

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <Search size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Global Similarity Detection</p>
              <p className="text-sm text-slate-400">Reverse-search style matching across platforms using embeddings and fraud signals.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={topMatch && topMatch.similarityScore > 70 ? "danger" : "info"}>{summaryLabel}</Badge>
          {foundOnMultiplePlatforms ? <Badge tone="warning">Found on multiple platforms</Badge> : null}
        </div>
      </div>

      {status ? <div className="mb-4 rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">{status}</div> : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <span key={platform} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
            {platform}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : matches.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <div key={match.matchId} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
              <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/12 via-slate-900/80 to-violet-400/10 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge tone={platformTone(match.source)}>{match.source}</Badge>
                  <Badge tone={match.similarityScore > 74 ? "danger" : match.similarityScore > 48 ? "warning" : "info"}>{match.similarityScore}%</Badge>
                </div>
                <p className="line-clamp-4 text-sm leading-6 text-slate-200">{match.preview}</p>
              </div>

              <p className="text-sm font-medium text-white">{match.caption}</p>
              <p className="mt-2 text-xs text-slate-400">Trust score: {match.trustScore}%</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {match.platforms.map((platform) => (
                  <span key={`${match.matchId}-${platform}`} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                    {platform}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{match.reportCount} reports logged</span>
                <span className="capitalize">{match.severity} severity</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" className="h-10 px-3 text-xs" onClick={() => handleReport(match, "report")} disabled={busyMatchId === match.matchId}>
                  <Flag size={14} />
                  Report as Fake
                </Button>
                <Button className="h-10 px-3 text-xs" onClick={() => handleReport(match, "takedown")} disabled={busyMatchId === match.matchId}>
                  <Siren size={14} />
                  Send Report
                </Button>
                <a
                  href={match.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                >
                  <ExternalLink size={14} />
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-cyan-100">
            <Sparkles size={20} />
          </div>
          <p className="mt-4 text-lg font-semibold text-white">No strong visual matches yet</p>
          <p className="mt-2 text-sm text-slate-400">The reverse-search index will populate as more content is verified across the platform.</p>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 text-amber-200" />
          <p>
            Similarity scores combine embedding overlap and indexed platform presence. Use this panel to spot duplicates, lightly modified fraud variants, and repeated cross-platform abuse.
          </p>
        </div>
      </div>
    </Card>
  );
}

export const SimilaritySearchPanel = memo(SimilaritySearchPanelBase);
