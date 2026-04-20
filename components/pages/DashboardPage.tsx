"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { UploadCard } from "@/components/upload/UploadCard";
import { TrustFingerprintCard } from "@/components/features/trust/TrustFingerprintCard";
import { AIConsensusPanel } from "@/components/features/trust/AIConsensusPanel";
import { AIExplanationPanel } from "@/components/features/trust/AIExplanationPanel";
import { AIExplanationVisualizer } from "@/components/features/trust/AIExplanationVisualizer";
import { TrustPassportPanel } from "@/components/features/trust/TrustPassportPanel";
import { ContentMutationPanel } from "@/components/features/trust/ContentMutationPanel";
import { TrustScoreBreakdown } from "@/components/features/trust/TrustScoreBreakdown";
import { MultilingualSupportPanel } from "@/components/features/trust/MultilingualSupportPanel";
import { AIAssistantPanel } from "@/components/features/trust/AIAssistantPanel";
import { TrustRiskDashboard } from "@/components/features/trust/TrustRiskDashboard";
import { NotificationCenter } from "@/components/features/trust/NotificationCenter";
import { OfflineDemoPanel } from "@/components/features/trust/OfflineDemoPanel";
import { TrustCopilotPanel } from "@/components/features/copilot/TrustCopilotPanel";
import { Graphs } from "@/components/dashboard/Graphs";
import { TrustEvolutionTimeline } from "@/components/dashboard/TrustEvolutionTimeline";
import { MisinformationNetworkGraph } from "@/components/dashboard/MisinformationNetworkGraph";
import { AIDebateMode } from "@/components/dashboard/AIDebateMode";
import { SourceCredibilityAnalyzer } from "@/components/dashboard/SourceCredibilityAnalyzer";
import { GlobalHeatmap } from "@/components/dashboard/GlobalHeatmap";
import { ExtensionMock } from "@/components/dashboard/ExtensionMock";
import { AutonomousAgentPanel } from "@/components/dashboard/AutonomousAgentPanel";
import { PredictiveRiskPanel } from "@/components/dashboard/PredictiveRiskPanel";
import { RealtimeTrustFeed } from "@/components/dashboard/RealtimeTrustFeed";
import { ContentLineageTracker } from "@/components/dashboard/ContentLineageTracker";
import { ExplainableAIPanel } from "@/components/dashboard/ExplainableAIPanel";
import { CommunityValidationPanel } from "@/components/dashboard/CommunityValidationPanel";
import { EnterpriseModePanel } from "@/components/dashboard/EnterpriseModePanel";
import { TamperDemoPanel } from "@/components/dashboard/TamperDemoPanel";
import { CreatorProfileCard } from "@/components/features/identity/CreatorProfileCard";
import { BlockchainStatusBadge } from "@/components/features/blockchain/BlockchainStatusBadge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertsPanel } from "@/components/alerts-panel";
import { HistoryPanel } from "@/components/history-panel";
import { demoSamples } from "@/lib/sample-data";
import { DashboardStateProvider, AnalyzeResponse, useDashboardState } from "@/hooks/useDashboardState";
import { tokenSimilarityPercent } from "@/utils/similarity";
import { cardReveal, staggerChildren } from "@/animations/presets";

const starter: AnalyzeResponse = {
  score: 23,
  risk: "high",
  credibility: "low",
  consensus: 56,
  matches: 0,
  confidence: 88,
  explanation: "The content uses urgency, miracle framing, and unsupported certainty, which are classic misinformation signals.",
  sources: { groq: 28, hf: 23, gpt: 21, gemma: 24 },
  txHash: "demo-seeded-text",
  blockchainStatus: "queued",
  creator: {
    creatorId: "creator_demo",
    displayName: "Demo Creator",
    credibilityScore: 62,
    riskLevel: "medium",
    verifiedBadge: false,
    totalUploads: 1,
    verifiedCount: 0,
    flaggedCount: 1,
    contentHistory: ["demo"],
    historySummary: "Demo Creator is still building credibility and currently has one flagged submission on record.",
    blockchainIdentityId: "DEMOIDENTITY001",
    identityStatus: "queued"
  },
  record: {
    id: "starter",
    hash: "demo",
    type: "text",
    fileName: "viral-health-claim.txt",
    creatorId: "creator_demo",
    creatorProfile: {
      creatorId: "creator_demo",
      displayName: "Demo Creator",
      credibilityScore: 62,
      riskLevel: "medium",
      verifiedBadge: false,
      totalUploads: 1,
      verifiedCount: 0,
      flaggedCount: 1,
      contentHistory: ["demo"],
      historySummary: "Demo Creator is still building credibility and currently has one flagged submission on record.",
      blockchainIdentityId: "DEMOIDENTITY001",
      identityStatus: "queued"
    },
    truthScore: 23,
    confidence: 88,
    executiveSummary: "The ensemble agrees that this claim is high-risk and likely misinformation.",
    explanation: "The claim uses urgency and miracle framing without credible sourcing.",
    findings: ["No trusted source reference detected."],
    suspiciousSignals: ["Viral forwarding language", "Unsupported medical certainty"],
    detectedClaims: [demoSamples.text],
    modelBreakdown: [],
    preprocessing: { contentHash: "demo", mimeType: "text/plain", byteLength: demoSamples.text.length, metadata: ["type:text"], sampledFrames: 0 },
    consensus: { label: "Consensus: likely false", meter: 56, weightedTruthScore: 23, confidence: 88, basedOn: ["groq", "openrouter", "gemma"] },
    trustFingerprint: {
      truthScore: 23,
      manipulationRisk: "high",
      sourceCredibility: "low",
      aiConsensus: 56,
      similarMatches: 0,
      confidence: 88,
      fingerprintId: "DEMO7AE760B20D11"
    },
    trustGraph: [],
    viralSignal: { repeatCount: 1, trendingScore: 73, status: "watch", clusterLabel: "Health misinformation cluster" },
    comparisonVisuals: [],
    timestamp: new Date().toISOString(),
    firstVerifiedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    occurrenceCount: 1,
    previouslyVerified: false,
    blockchainStatus: "queued",
    transactionHash: "demo-seeded-text",
    sourcePreview: demoSamples.text
  }
};

function DashboardContent() {
  const {
    demoMode,
    setDemoMode,
    enterpriseMode,
    setEnterpriseMode,
    loading,
    error,
    result,
    records,
    alerts,
    feed,
    community,
    copilot,
    verifyContent,
    refresh
  } = useDashboardState();

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const graphRecords = useMemo(() => records.map((record) => ({ timestamp: record.timestamp, score: record.truthScore })), [records]);
  const timelinePoints = useMemo(
    () =>
      records.map((record, index) => ({
        timestamp: record.timestamp,
        trust: Math.max(12, Math.min(96, record.truthScore + record.occurrenceCount * 3 - index * 2))
      })),
    [records]
  );
  const networkNodes = useMemo(
    () => [
      { id: "core", label: "Current", x: "50%", y: "50%", cluster: (result.score < 40 ? "fake" : "watch") as "fake" | "watch" | "clean" },
      { id: "n1", label: "Clip A", x: "22%", y: "26%", cluster: "fake" as const },
      { id: "n2", label: "Post B", x: "76%", y: "22%", cluster: "watch" as const },
      { id: "n3", label: "Image C", x: "28%", y: "72%", cluster: "fake" as const },
      { id: "n4", label: "Source D", x: "74%", y: "70%", cluster: "clean" as const }
    ],
    [result.score]
  );
  const networkEdges = useMemo(
    () => [
      { from: "core", to: "n1" },
      { from: "core", to: "n2" },
      { from: "core", to: "n3" },
      { from: "n2", to: "n4" }
    ],
    []
  );
  const debate = useMemo(
    () => ({
      left: {
        speaker: "GROQ Rapid Analyst",
        stance: (result.score < 50 ? "challenges" : "supports") as "supports" | "challenges",
        message:
          result.score < 50
            ? "This content moves like a viral manipulation campaign: urgent phrasing, low evidence density, and strong spread incentives."
            : "The content pattern does not strongly resemble high-risk viral misinformation and may be legitimate."
      },
      right: {
        speaker: "GPT Reasoning Auditor",
        stance: (result.score < 70 ? "challenges" : "supports") as "supports" | "challenges",
        message:
          result.score < 70
            ? "Even if some surface details appear plausible, the source trail is weak enough that I would not trust this without verification."
            : "The reasoning pass found enough contextual support to avoid a false alarm, though provenance still matters."
      },
      consensus:
        result.score < 40
          ? "Final consensus: the ensemble sides with the cautious models and classifies this as likely fake."
          : result.score < 70
            ? "Final consensus: the ensemble remains split, so the system keeps the content in a warning state."
            : "Final consensus: the ensemble sees more evidence for legitimacy than manipulation."
    }),
    [result.score]
  );
  const heatRegions = useMemo(
    () => [
      { region: "North America", x: "24%", y: "36%", intensity: 78 },
      { region: "Europe", x: "49%", y: "28%", intensity: 64 },
      { region: "South Asia", x: "66%", y: "46%", intensity: 82 },
      { region: "Africa", x: "52%", y: "58%", intensity: 58 }
    ],
    []
  );
  const predictiveForecast = useMemo(() => Math.max(18, Math.min(96, result.score < 40 ? 88 : result.score < 70 ? 64 : 28)), [result.score]);
  const predictiveBadge = predictiveForecast > 75 ? "high" : predictiveForecast > 45 ? "medium" : "low";
  const lineage = useMemo(
    () => [
      { stage: "Origin", label: `${result.record.fileName} first appeared in creator channel ${result.record.creatorId}` },
      { stage: "Amplification", label: `Detected in ${result.record.occurrenceCount} repeated uploads and mirrored posts.` },
      { stage: "Verification", label: `Trust fingerprint ${result.record.trustFingerprint.fingerprintId} issued and anchored.` }
    ],
    [result.record]
  );
  const enterpriseAnalytics = useMemo(
    () => [
      { label: "Trust Feed", value: `${feed.length}` },
      { label: "Flagged Content", value: `${records.filter((record) => record.truthScore < 40).length}` },
      { label: "Verified Creators", value: `${records.filter((record) => record.creatorProfile.verifiedBadge).length}` },
      { label: "Average Credibility", value: `${Math.round(records.reduce((sum, record) => sum + record.creatorProfile.credibilityScore, 0) / Math.max(records.length, 1))}%` }
    ],
    [feed.length, records]
  );
  const nearestMutation = useMemo(() => {
    const candidates = records
      .filter((record) => record.hash !== result.record.hash)
      .map((record) => ({
        label: record.fileName,
        similarity: tokenSimilarityPercent(result.record.sourcePreview, record.sourcePreview)
      }))
      .sort((left, right) => right.similarity - left.similarity)[0];

    return candidates || { label: "No similar baseline found yet.", similarity: 100 };
  }, [records, result.record.hash, result.record.sourcePreview]);
  const mismatch = nearestMutation.similarity < 100 && nearestMutation.similarity >= 45;
  const notifications = useMemo(
    () =>
      [
        result.score < 40
          ? {
              id: "risk-detected",
              title: "High-risk content detected",
              detail: `${result.record.fileName} triggered a likely-fake verdict and should not be shared without verification.`,
              level: "danger" as const
            }
          : null,
        mismatch
          ? {
              id: "mutation-detected",
              title: "Content mutation detected",
              detail: `This upload is ${nearestMutation.similarity}% similar to ${nearestMutation.label} and may be an edited variant.`,
              level: "warning" as const
            }
          : null,
        {
          id: "passport-ready",
          title: "Trust passport generated",
          detail: "A shareable trust link and QR code are ready for external verification.",
          level: "info" as const
        }
      ].filter(Boolean) as Array<{ id: string; title: string; detail: string; level: "info" | "warning" | "danger" }>,
    [mismatch, nearestMutation.label, nearestMutation.similarity, result.record.fileName, result.score]
  );
  const agentAlerts = useMemo(
    () => [
      {
        id: "agent-1",
        title: "Autonomous watchlist escalation",
        detail: `${result.record.fileName} matched a monitored misinformation pattern and was routed for rapid fingerprinting.`,
        severity: result.score < 40 ? ("critical" as const) : ("watch" as const)
      },
      {
        id: "agent-2",
        title: "Creator risk drift detected",
        detail: `${result.creator.displayName} now sits at ${result.creator.credibilityScore}% credibility after recent submissions.`,
        severity: result.creator.credibilityScore < 55 ? ("critical" as const) : ("watch" as const)
      }
    ],
    [result]
  );
  return (
    <AppShell title="TruthChain X" subtitle="Global Trust Intelligence Platform">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-6">
        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[0.7fr,1.05fr,0.85fr]">
          <div className="panel panel-hover rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/80">AI Summary</p>
                <p className="mt-2 text-2xl font-semibold text-white">Rapid trust briefing</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs ${result.score < 40 ? "bg-rose-400/10 text-rose-200" : result.score < 70 ? "bg-amber-400/10 text-amber-200" : "bg-emerald-400/10 text-emerald-200"}`}>
                {result.score < 40 ? "Likely fake" : result.score < 70 ? "Needs review" : "Likely real"}
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300">{result.record.executiveSummary}</p>
            <div className="mt-6 space-y-3">
              {result.record.suspiciousSignals.slice(0, 3).map((signal) => (
                <div key={signal} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {signal}
                </div>
              ))}
            </div>
          </div>
          <UploadCard loading={loading} demoMode={demoMode} onDemoModeChange={setDemoMode} onVerify={verifyContent} />
          <div className="grid gap-6">
            <TrustFingerprintCard
              score={result.score}
              risk={result.risk}
              credibility={result.credibility}
              consensus={result.consensus}
              matches={result.matches}
              confidence={result.confidence}
            />
            <CreatorProfileCard creator={result.creator} />
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">Blockchain Status</p>
                  <p className="text-sm text-slate-400">Fingerprint anchored on testnet with a reusable content hash.</p>
                </div>
              </div>
              <BlockchainStatusBadge status={result.blockchainStatus} txHash={result.txHash} />
            </Card>
          </div>
        </motion.section>

        {error ? <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}

        <motion.section variants={cardReveal}>
          <TrustCopilotPanel copilot={copilot} updatedAtLabel={new Date(copilot.learning.updatedAt).toLocaleTimeString()} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
          <AIExplanationPanel explanation={result.explanation} />
          <AIConsensusPanel sources={result.sources} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <AIExplanationVisualizer content={result.record.sourcePreview} signals={result.record.suspiciousSignals} type={result.record.type} />
          <TrustScoreBreakdown models={result.record.modelBreakdown} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <ExplainableAIPanel highlights={result.record.suspiciousSignals} reasoning={result.record.executiveSummary} />
          <PredictiveRiskPanel
            forecast={predictiveForecast}
            badge={predictiveBadge}
            rationale="Forecast combines current trust score, repeat-upload behavior, community reaction, and creator credibility drift."
          />
        </motion.section>

        {result.record.previouslyVerified ? (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Already Verified. Previous fingerprint found and loaded from cache.
          </div>
        ) : null}

        {loading ? (
          <motion.section variants={cardReveal} className="grid gap-5 xl:grid-cols-2">
            {[0, 1].map((item) => (
              <Skeleton key={item} className="h-80" />
            ))}
          </motion.section>
        ) : (
          <motion.section variants={cardReveal} className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <TrustEvolutionTimeline points={timelinePoints} />
              <SourceCredibilityAnalyzer
                score={result.record.trustFingerprint.confidence}
                reliability={result.credibility}
                historyLabel={
                  result.record.occurrenceCount > 1
                    ? `This content has appeared ${result.record.occurrenceCount} times. Previous behavior suggests repeat circulation in suspicious channels.`
                    : "No prior source history exists yet, so the system is leaning on model context and trust signals."
                }
              />
            </div>
            <Graphs records={graphRecords} />
          </motion.section>
        )}

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <AlertsPanel alerts={alerts} />
          <RealtimeTrustFeed items={feed} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <NotificationCenter items={notifications} />
          <TrustRiskDashboard records={records} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <AIDebateMode left={debate.left} right={debate.right} consensus={debate.consensus} />
          <ExtensionMock
            verdict={result.score < 55 ? "warning" : "safe"}
            score={result.score}
            message={result.score < 55 ? "This content is likely fake. Verify before sharing." : "This content currently appears low-risk, but stay alert for context changes."}
          />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <MisinformationNetworkGraph nodes={networkNodes} edges={networkEdges} />
          <GlobalHeatmap regions={heatRegions} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <ContentLineageTracker lineage={lineage} />
          <CommunityValidationPanel hash={result.record.hash} initial={community} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <ContentMutationPanel
            hash={result.record.hash}
            type={result.record.type}
            content={result.record.sourcePreview}
            similarityScore={nearestMutation.similarity}
            mismatch={mismatch}
            baselineLabel={nearestMutation.label}
          />
          <MultilingualSupportPanel language={result.record.preprocessing.language} />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <AutonomousAgentPanel alerts={agentAlerts} />
          <TamperDemoPanel />
        </motion.section>

        <motion.section variants={cardReveal} className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <TrustPassportPanel
            hash={result.record.hash}
            fingerprintId={result.record.trustFingerprint.fingerprintId}
            score={result.score}
            txHash={result.txHash}
          />
          <AIAssistantPanel
            hash={result.record.hash}
            score={result.score}
            explanation={result.explanation}
            creatorName={result.creator.displayName}
            risk={result.risk}
          />
        </motion.section>

        <motion.section variants={cardReveal}>
          <OfflineDemoPanel enabled={demoMode} onEnable={() => setDemoMode(true)} sampleText={demoSamples.text} />
        </motion.section>

        <EnterpriseModePanel enabled={enterpriseMode} onToggle={setEnterpriseMode} analytics={enterpriseAnalytics} />

        {enterpriseMode ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <HistoryPanel records={records.slice(0, 8)} />
            <SourceCredibilityAnalyzer
              score={result.record.trustFingerprint.confidence}
              reliability={result.credibility}
              historyLabel={`Enterprise mode: trust-and-safety teams can compare creator reputation (${result.creator.credibilityScore}%) against content risk in one workflow.`}
            />
          </section>
        ) : null}
      </motion.div>
    </AppShell>
  );
}

export function DashboardPage() {
  return (
    <DashboardStateProvider starter={starter}>
      <DashboardContent />
    </DashboardStateProvider>
  );
}
