"use client";

import { memo, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";

function ContentMutationPanelBase({
  hash,
  type,
  content,
  similarityScore,
  mismatch,
  baselineLabel
}: {
  hash: string;
  type: "text" | "image" | "video";
  content: string;
  similarityScore: number;
  mismatch: boolean;
  baselineLabel: string;
}) {
  const [liveScore, setLiveScore] = useState(similarityScore);
  const [liveMismatch, setLiveMismatch] = useState(mismatch);
  const [liveBaseline, setLiveBaseline] = useState(baselineLabel);

  useEffect(() => {
    api
      .post<{ similarityScore: number; modified: boolean; baseline: { fileName: string } }>("/api/similarity-check", {
        currentHash: hash,
        type,
        content
      })
      .then((data) => {
        setLiveScore(data.similarityScore);
        setLiveMismatch(data.modified);
        setLiveBaseline(data.baseline?.fileName || baselineLabel);
      })
      .catch(() => undefined);
  }, [baselineLabel, content, hash, type]);

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">Content Mutation Detection</p>
          <p className="text-sm text-slate-400">Embedding-style similarity check to detect edited or lightly modified reposts.</p>
        </div>
        <Badge tone={mismatch ? "warning" : "success"}>{mismatch ? "Mismatch Alert" : "Stable Match"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.85fr,1.15fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Similarity score</p>
          <p className="mt-3 text-4xl font-semibold text-white">{liveScore}%</p>
          <div className="mt-4 h-3 rounded-full bg-white/10">
            <div className={`h-full rounded-full ${liveMismatch ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-cyan-500 to-emerald-500"}`} style={{ width: `${liveScore}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Nearest baseline</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{liveBaseline}</p>
          <p className="mt-3 text-sm text-slate-400">
            {liveMismatch
              ? "This content looks close to a previously verified item, but enough wording or structural drift exists to treat it as a modified mutation."
              : "This content is either an exact re-upload or not meaningfully altered against its nearest baseline."}
          </p>
        </div>
      </div>
    </Card>
  );
}

export const ContentMutationPanel = memo(ContentMutationPanelBase);
