"use client";

import { AlertTriangle, Globe2, Radio, TrendingUp } from "lucide-react";
import { RealtimeTrustFeed } from "@/components/dashboard/RealtimeTrustFeed";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";

export default function IntelligencePage() {
  return (
    <WorkspacePage title="Intelligence" subtitle="Simple visibility into spread, alerts, and regional pressure">
      {({ intelligence }) => {
        const cards = [
          {
            title: "Global Risk",
            info: `${intelligence.riskIndex.globalRiskScore}% monitored pressure across active regions.`,
            icon: Globe2
          },
          {
            title: "Top Region",
            info: intelligence.riskIndex.topRiskRegions[0]?.region || "No dominant region detected yet.",
            icon: Radio
          },
          {
            title: "Trending Topics",
            info: intelligence.riskIndex.trendingFakeTopics.slice(0, 3).join(", ") || "No major topics flagged right now.",
            icon: TrendingUp
          },
          {
            title: "Active Alerts",
            info: `${intelligence.alerts.length} intelligence alerts currently tracked.`,
            icon: AlertTriangle
          }
        ];

        return (
          <div className="space-y-6">
            <PageHero
              eyebrow="Intelligence"
              title="See the spread story without the clutter"
              description="This view now stays simple: headline risk, the most important regional signals, and the current feed of intelligence events."
              badges={[
                { label: "Regional Monitoring", tone: "info" },
                { label: "Spread Signals", tone: "warning" }
              ]}
              stats={[
                { label: "Global Risk", value: `${intelligence.riskIndex.globalRiskScore}%`, detail: "Current overall pressure" },
                { label: "Active Alerts", value: `${intelligence.alerts.length}`, detail: "Items that need attention" }
              ]}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} hover={false} className="rounded-2xl p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-lg font-semibold text-white">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.info}</p>
                  </Card>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <Card hover={false} className="rounded-2xl p-6">
                <p className="text-lg font-semibold text-white">Spread Summary</p>
                <div className="mt-5 space-y-3">
                  {intelligence.crossPlatform.slice(0, 4).map((hop, index) => (
                    <div key={`${hop.platform}-${hop.timestamp}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-sm font-medium text-white">{hop.platform}</p>
                      <p className="mt-1 text-sm text-slate-400">Stage {index + 1} | {hop.status}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card hover={false} className="rounded-2xl p-6">
                <p className="text-lg font-semibold text-white">Prediction</p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xl font-semibold text-white">{intelligence.prediction.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{intelligence.prediction.rationale}</p>
                </div>
              </Card>
            </section>

            <RealtimeTrustFeed items={intelligence.feed} />
          </div>
        );
      }}
    </WorkspacePage>
  );
}
