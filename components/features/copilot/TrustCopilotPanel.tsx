"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, BrainCircuit, ChevronRight, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CopilotSnapshot } from "@/lib/types";
import { listItem } from "@/animations/presets";

function toneForSeverity(value: "low" | "medium" | "high") {
  if (value === "high") return "danger";
  if (value === "medium") return "warning";
  return "info";
}

function TrustCopilotPanelBase({
  copilot,
  updatedAtLabel
}: {
  copilot: CopilotSnapshot;
  updatedAtLabel: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [visibleAlerts, setVisibleAlerts] = useState(copilot.alerts);
  const scanMessages = useMemo(
    () => [
      "Scanning trust feed for suspicious clusters.",
      "Refreshing creator reputation and exposure signals.",
      "Updating Copilot recommendations from recent activity.",
      "Watching for mutations and spread acceleration."
    ],
    []
  );
  const [scanIndex, setScanIndex] = useState(0);

  useEffect(() => {
    setVisibleAlerts(copilot.alerts);
  }, [copilot.alerts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScanIndex((current) => (current + 1) % scanMessages.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [scanMessages.length]);

  useEffect(() => {
    if (!visibleAlerts.length) return undefined;

    const timers = visibleAlerts
      .filter((alert) => alert.autoDismissMs)
      .map((alert) =>
        window.setTimeout(() => {
          setVisibleAlerts((current) => current.filter((item) => item.id !== alert.id));
        }, alert.autoDismissMs)
      );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [visibleAlerts]);

  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-300/70 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/80">Trust Copilot AI</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Autonomous Intelligence Layer</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            A live trust copilot that watches content, explains risk, suggests actions, and adapts its guidance as the platform learns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Updated</p>
            <p className="mt-1 text-sm text-slate-200">{updatedAtLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition duration-200 hover:border-cyan-300/30 hover:text-white"
            aria-label={expanded ? "Collapse copilot panel" : "Expand copilot panel"}
          >
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronRight size={18} />
            </motion.span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/14 to-blue-500/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trust score</p>
          <p className="mt-3 text-3xl font-semibold text-white">{copilot.userInsights.trustScore}%</p>
          <p className="mt-2 text-sm text-slate-300">Current trust health for the active content.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-400/14 to-fuchsia-500/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Exposure level</p>
          <p className="mt-3 text-3xl font-semibold text-white">{copilot.userInsights.exposureLevel}%</p>
          <p className="mt-2 text-sm text-slate-300">How much risky trust activity surrounds this stream.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-amber-300/14 to-orange-500/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk level</p>
          <p className="mt-3 text-3xl font-semibold capitalize text-white">{copilot.userInsights.riskLevel}</p>
          <p className="mt-2 text-sm text-slate-300">Your current personal trust exposure classification.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Continuous learning</p>
            <Badge tone="info">Active</Badge>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{copilot.learning.progress}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
            <motion.div
              animate={{ width: `${copilot.learning.progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="h-3 w-3 rounded-full bg-cyan-300"
          />
          <AnimatePresence mode="wait">
            <motion.p key={scanIndex} variants={listItem} initial="hidden" animate="visible" exit="exit" className="text-sm text-slate-200">
              {scanMessages[scanIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="copilot-expanded"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 2xl:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Insights</p>
                      <p className="text-sm text-slate-400">Autonomous interpretations generated from trust, identity, and spread signals.</p>
                    </div>
                    <Badge tone="info">{copilot.insights.length} live</Badge>
                  </div>
                  <div className="space-y-3">
                    {copilot.insights.map((insight, index) => (
                      <motion.div
                        key={insight.id}
                        variants={listItem}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.06 }}
                        className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-400/10 text-cyan-100">
                              {insight.kind === "behavior" ? <BrainCircuit size={16} /> : insight.kind === "monitoring" ? <Radar size={16} /> : <ShieldAlert size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{insight.title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-300">{insight.detail}</p>
                            </div>
                          </div>
                          <Badge tone={toneForSeverity(insight.severity)}>{insight.severity}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Suggestions</p>
                      <p className="text-sm text-slate-400">Context-aware recommendations generated by the Copilot engine.</p>
                    </div>
                    <Badge tone="info">{copilot.suggestions.length} actions</Badge>
                  </div>
                  <div className="space-y-3">
                    {copilot.suggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        variants={listItem}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.06 }}
                        className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{suggestion.message}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{suggestion.recommendation}</p>
                          </div>
                          <Badge tone={toneForSeverity(suggestion.severity)}>{suggestion.severity}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">AI Messages</p>
                      <p className="text-sm text-slate-400">Chat-like Copilot updates and system notices.</p>
                    </div>
                    <Badge tone="info">Context aware</Badge>
                  </div>
                  <div className="space-y-3">
                    {copilot.messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        variants={listItem}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.08 }}
                        className={`rounded-xl px-4 py-4 text-sm leading-6 ${message.role === "assistant" ? "bg-cyan-400/10 text-slate-100" : "bg-white/5 text-slate-300"}`}
                      >
                        {message.content}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Smart alerts</p>
                      <p className="text-sm text-slate-400">Auto-dismissing notifications triggered by trust conditions.</p>
                    </div>
                    <div className="relative">
                      <BellRing size={18} className="text-slate-200" />
                      {visibleAlerts.length ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.8)]" /> : null}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {visibleAlerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          variants={listItem}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ delay: index * 0.05 }}
                          className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{alert.title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-300">{alert.detail}</p>
                            </div>
                            <Badge tone={toneForSeverity(alert.severity)}>{alert.severity}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {!visibleAlerts.length ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">No active alerts at the moment. Copilot is still monitoring.</p> : null}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/8 to-violet-400/8 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-cyan-100">
                      <BrainCircuit size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">Behavior summary</p>
                      <p className="text-sm text-slate-300">{copilot.userInsights.behaviorSummary}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{copilot.learning.status}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export const TrustCopilotPanel = memo(TrustCopilotPanelBase);
