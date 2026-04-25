"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { ExplainabilityFactor, ModelContribution } from "@/lib/types";

function TrustScoreBreakdownBase({ models, factors = [] }: { models: ModelContribution[]; factors?: ExplainabilityFactor[] }) {
  const rows = useMemo(
    () => {
      if (factors.length) {
        return factors.map((factor) => ({
          label: factor.label,
          contribution: factor.value,
          detail: factor.detail,
          impact: factor.impact
        }));
      }

      return models.map((model) => ({
        label: model.provider,
        contribution: Math.round(model.truthScore * model.weight),
        detail: model.role,
        impact: model.truthScore >= 60 ? "positive" : model.truthScore < 40 ? "negative" : "neutral"
      }));
    },
    [factors, models]
  );

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Trust Score Breakdown</p>
        <p className="text-sm text-slate-400">
          {factors.length ? "Weighted factor contribution from AI, source credibility, history, similarity, and open-source evidence." : "Weighted factor contribution from each AI system in the ensemble."}
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="capitalize text-slate-300">{row.label}</span>
              <span className="text-white">{row.contribution}</span>
            </div>
            <div className="h-3 rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  row.impact === "negative"
                    ? "bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400"
                    : row.impact === "neutral"
                      ? "bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-400"
                      : "bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
                }`}
                style={{ width: `${Math.min(row.contribution, 100)}%` }}
              />
            </div>
            {row.detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{row.detail}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

export const TrustScoreBreakdown = memo(TrustScoreBreakdownBase);
