"use client";

import { AIAssistantPanel } from "@/components/features/trust/AIAssistantPanel";
import { NotificationCenter } from "@/components/features/trust/NotificationCenter";
import { TrustCopilotPanel } from "@/components/features/copilot/TrustCopilotPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { WorkspacePage } from "@/components/pages/workspace/WorkspacePage";

export default function CopilotPage() {
  return (
    <WorkspacePage title="Copilot" subtitle="Live guidance, suggested actions, and conversational support for phishing review">
      {({ result, copilot }) => {
        const notifications = [
          ...(copilot.alerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            detail: alert.detail,
            level: alert.severity === "high" ? ("danger" as const) : alert.severity === "medium" ? ("warning" as const) : ("info" as const)
          })) ?? []),
          ...(result
            ? [{
                id: "assistant-status",
                title: "Assistant context ready",
                detail: `The active conversation is grounded in ${result.record.fileName} and the latest risk evidence.`,
                level: "info" as const
              }]
            : [])
        ];

        return (
          <div className="space-y-6">
            <PageHero
              eyebrow="AI Copilot"
              title="Guidance that feels confident, calm, and useful"
              description="Copilot now has its own presentation space so judges can clearly see the intelligence layer: live suggestions, human-readable explanations, and action-oriented prompts."
              badges={[
                { label: "Secure Copilot Channel", tone: "info" },
                { label: "Verified Guidance", tone: "success" },
                { label: "AI Confidence High", tone: "info" }
              ]}
              stats={[
                { label: "Suggestions", value: `${copilot.suggestions.length}`, detail: "Live recommended actions" },
                { label: "Learning State", value: `${copilot.learning.progress}%`, detail: "Continuous model adaptation" }
              ]}
            />

            <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <Card hover={false}>
                <p className="text-lg font-semibold text-white">Current assistant context</p>
                {result ? (
                  <>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{result.record.executiveSummary}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active hash</p>
                        <p className="mt-3 text-sm font-medium text-white">{result.record.hash.slice(0, 12)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk</p>
                        <p className="mt-3 text-sm font-medium capitalize text-white">{result.category}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                        <p className="mt-3 text-sm font-medium text-white">{result.confidence}%</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-300">Run a live verification first. Copilot won’t invent context when there is no backend result to ground it.</p>
                )}
              </Card>
            </section>

            <TrustCopilotPanel copilot={copilot} updatedAt={copilot.learning.updatedAt} />

            <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              {result ? (
                <AIAssistantPanel
                  hash={result.record.hash}
                  score={result.trustScore}
                  explanation={result.explanation}
                  creatorName={result.creator.displayName}
                  risk={result.category}
                />
              ) : (
                <Card hover={false}>
                  <p className="text-lg font-semibold text-white">Assistant unavailable</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">Feature not connected to backend until a live verification result is available.</p>
                </Card>
              )}
              <NotificationCenter items={notifications} />
            </section>
          </div>
        );
      }}
    </WorkspacePage>
  );
}
