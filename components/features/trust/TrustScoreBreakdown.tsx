"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { ModelContribution } from "@/lib/types";

function TrustScoreBreakdownBase({ models }: { models: ModelContribution[] }) {
  const rows = useMemo(
    () =>
      models.map((model) => ({
        label: model.provider,
        contribution: Math.round(model.truthScore * model.weight)
      })),
    [models]
  );

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Trust Score Breakdown</p>
        <p className="text-sm text-slate-400">Weighted factor contribution from each AI system in the ensemble.</p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="capitalize text-slate-300">{row.label}</span>
              <span className="text-white">{row.contribution}</span>
            </div>
            <div className="h-3 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500" style={{ width: `${Math.min(row.contribution, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export const TrustScoreBreakdown = memo(TrustScoreBreakdownBase);
