"use client";

import { memo } from "react";
import { BadgeCheck, Shield, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreatorProfile } from "@/lib/types";

function CreatorProfileCardBase({ creator }: { creator: CreatorProfile }) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{creator.displayName}</p>
            <p className="text-sm text-slate-400">Creator identity intelligence</p>
          </div>
        </div>
        {creator.verifiedBadge ? (
          <Badge tone="success" className="inline-flex items-center gap-1">
            <BadgeCheck className="h-4 w-4" />
            Verified
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Credibility Score" value={`${creator.credibilityScore}%`} />
        <Stat label="Risk Level">
          <Badge tone={creator.riskLevel === "high" ? "danger" : creator.riskLevel === "medium" ? "warning" : "success"} className="text-sm capitalize">
            {creator.riskLevel}
          </Badge>
        </Stat>
        <Stat label="Uploads" value={String(creator.totalUploads)} />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Identity Anchor</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <Shield className="h-4 w-4" />
            <span>{creator.identityStatus === "confirmed" ? "On-chain" : "Queued"}</span>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">{creator.blockchainIdentityId}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/25 p-4 text-sm leading-7 text-slate-300">{creator.historySummary}</div>
    </Card>
  );
}

function Stat({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {children || <p className="mt-3 text-3xl font-semibold text-white">{value}</p>}
    </div>
  );
}

export const CreatorProfileCard = memo(CreatorProfileCardBase);
