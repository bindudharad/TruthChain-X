"use client";

import { CreatorProfileCard } from "@/components/features/identity/CreatorProfileCard";
import { TrustIdentityPassportCard } from "@/components/features/identity/TrustIdentityPassportCard";
import { BlockchainStatusBadge } from "@/components/features/blockchain/BlockchainStatusBadge";
import { PageHero } from "@/components/layout/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";

export default function ProfilePage() {
  return (
    <WorkspacePage title="Profile" subtitle="Identity, trust posture, permissions, and account-linked scan context">
      {({ result, records }) => (
        <div className="space-y-6">
          <PageHero
            eyebrow="Profile & Access"
            title="Identity, verification, and permissions in one trustworthy surface"
            description="This page reinforces product trust: who the analyst is, what permissions they have, and what verification state backs their work. It makes the platform feel governed, not just clever."
            badges={[
              { label: result ? (result.creator.verifiedBadge ? "Verified User" : "Review Pending") : "No active analyst", tone: result ? (result.creator.verifiedBadge ? "success" : "warning") : "info" },
              { label: "Secure Identity Anchor", tone: "info" },
              { label: "Permission Controls", tone: "info" }
            ]}
            stats={[
              { label: "Stored Scans", value: `${records.length}`, detail: "Activity in this workspace" },
              { label: "Flagged Items", value: `${records.filter((record) => record.truthScore < 40).length}`, detail: "Items needing follow-up" }
            ]}
          />

            <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <Card hover={false}>
                <p className="text-lg font-semibold text-white">Recent account activity</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Stored scans</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{records.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Flagged items</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{records.filter((record) => record.truthScore < 40).length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest sync</p>
                  <div className="mt-3">
                    {result ? <BlockchainStatusBadge status={result.blockchainStatus} txHash={result.txHash} /> : <p className="text-sm text-slate-400">No verification synced yet.</p>}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <TrustIdentityPassportCard />
            {result ? (
              <CreatorProfileCard creator={result.creator} />
            ) : (
              <Card hover={false}>
                <p className="text-lg font-semibold text-white">Creator profile unavailable</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">Run a live scan to populate the connected creator profile instead of showing seeded review data.</p>
              </Card>
            )}
          </section>
        </div>
      )}
    </WorkspacePage>
  );
}
