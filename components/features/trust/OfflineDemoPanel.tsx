"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function OfflineDemoPanelBase({
  enabled,
  onEnable,
  sampleText
}: {
  enabled: boolean;
  onEnable: () => void;
  sampleText: string;
}) {
  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">Offline Demo Mode</p>
        <p className="text-sm text-slate-400">Preloaded trust data ensures the platform still demos smoothly without live APIs.</p>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Current mode: <span className="font-semibold text-white">{enabled ? "Offline-safe demo enabled" : "Live-first mode"}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Sample payload: {sampleText}
        </div>
        <Button variant="secondary" onClick={onEnable}>
          Keep Demo Mode Ready
        </Button>
      </div>
    </Card>
  );
}

export const OfflineDemoPanel = memo(OfflineDemoPanelBase);
