"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function MultilingualSupportPanelBase({
  language
}: {
  language?: {
    code: string;
    label: string;
    confidence: number;
  };
}) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">Multilingual Support</p>
          <p className="text-sm text-slate-400">Detects content language and shows readiness for multilingual trust workflows.</p>
        </div>
        <Badge tone="info">{language?.label || "Unknown"}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Info title="Detected language" value={language?.label || "Unknown"} />
        <Info title="Confidence" value={`${language?.confidence || 0}%`} />
        <Info title="Mode" value={language?.code === "visual" ? "Visual-only" : "Text-aware"} />
      </div>
    </Card>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm text-slate-200">{value}</p>
    </div>
  );
}

export const MultilingualSupportPanel = memo(MultilingualSupportPanelBase);
