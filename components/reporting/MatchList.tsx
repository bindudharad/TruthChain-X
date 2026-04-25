"use client";

import { SimilarityMatch } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

function severityTone(value: SimilarityMatch["severity"]) {
  if (value === "high") return "danger";
  if (value === "medium") return "warning";
  return "info";
}

export function MatchList({
  matches,
  selectedIds,
  onToggle,
  onToggleAll,
  activeId,
  onActivate
}: {
  matches: SimilarityMatch[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  activeId?: string | null;
  onActivate: (match: SimilarityMatch) => void;
}) {
  const allSelected = matches.length > 0 && selectedIds.length === matches.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="h-4 w-4 rounded border-white/10 bg-slate-950/30" />
          Select All
        </label>
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{selectedIds.length} selected</span>
      </div>

      <div className="hidden grid-cols-[44px,110px,1.4fr,0.6fr,0.6fr,0.55fr] gap-3 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500 lg:grid">
        <span />
        <span>Platform</span>
        <span>Preview</span>
        <span>Similarity</span>
        <span>Trust</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-white/8">
        {matches.length ? (
          matches.map((match) => {
            const selected = selectedIds.includes(match.matchId);
            const active = activeId === match.matchId;

            return (
              <button
                key={match.matchId}
                type="button"
                onClick={() => onActivate(match)}
                className={cn(
                  "grid w-full gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03] lg:grid-cols-[44px,110px,1.4fr,0.6fr,0.6fr,0.55fr] lg:items-center",
                  active && "bg-cyan-400/[0.06]"
                )}
              >
                <div onClick={(event) => event.stopPropagation()} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(match.matchId)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950/30"
                  />
                </div>
                <div>
                  <Badge tone={match.source === "TruthChain" ? "success" : "info"}>{match.source}</Badge>
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-white">{match.caption}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{match.preview}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{match.similarityScore}%</p>
                  <p className="text-xs text-slate-500">similarity</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{match.trustScore}%</p>
                  <p className="text-xs text-slate-500">trust</p>
                </div>
                <div className="flex items-center justify-between gap-2 lg:block">
                  <Badge tone={severityTone(match.severity)} className="capitalize">
                    {match.severity}
                  </Badge>
                  <p className="mt-1 text-xs text-slate-500">{match.reportCount} reports</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No suspicious matches are available yet. Run a scan or load the seeded demo dataset to populate this moderation list.
          </div>
        )}
      </div>
    </div>
  );
}
