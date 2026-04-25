"use client";

import { Newspaper, DatabaseZap, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OpenSourceSignal } from "@/lib/types";

function signalIcon(kind: OpenSourceSignal["kind"]) {
  if (kind === "news") return Newspaper;
  if (kind === "dataset") return DatabaseZap;
  return Users;
}

function toneFromStance(stance: OpenSourceSignal["stance"]) {
  if (stance === "supports") return "success" as const;
  if (stance === "challenges") return "danger" as const;
  return "warning" as const;
}

export function OpenSourceSignalsPanel({ signals }: { signals: OpenSourceSignal[] }) {
  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Open-Source Truth Intelligence</p>
        <p className="text-sm text-slate-400">Newsroom, public dataset, and community signals aggregated into the broader trust decision.</p>
      </div>
      <div className="space-y-3">
        {signals.length ? (
          signals.map((signal) => {
            const Icon = signalIcon(signal.kind);

            return (
              <div key={signal.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/30 text-cyan-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{signal.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{signal.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={toneFromStance(signal.stance)}>{signal.stance}</Badge>
                        <span className="text-xs text-slate-500">{signal.source}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{signal.score}%</p>
                    <p className="text-xs text-slate-500">confidence {signal.confidence}%</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-sm text-slate-400">
            No open-source signals were available for this record.
          </div>
        )}
      </div>
    </Card>
  );
}
