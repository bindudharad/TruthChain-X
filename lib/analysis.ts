import {
  AnalysisInput,
  AnalysisResult,
  ComparisonVisual,
  ConsensusReport,
  ExplainabilityFactor,
  FactTimelineStep,
  OpenSourceSignal,
  TrustGraphLink,
  VerificationRecord,
  ViralSignal
} from "@/lib/types";
import { tokenSimilarity } from "@/services/ensembleEngine";
import { hashContent } from "@/lib/hashing";
import { ANALYSIS_REVISION } from "@/lib/analysis-version";
import { runAiOrchestration } from "@/server/services/ensemble/engine";
import { detectLanguageSignal } from "@/lib/language";
import { collectOpenSourceSignals } from "@/services/research/openSourceTruthEngine";
import { buildAIDetection, buildMediaAnalysis, detectSensitiveContent } from "@/services/media-analysis";
import { buildUnifiedTrustResult } from "@/services/trust-intelligence";
import { analyzeClaimVerification } from "@/services/research/claimVerification";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function safely<T>(factory: () => T, fallback: T) {
  try {
    return factory();
  } catch {
    return fallback;
  }
}

function buildConsensus(scores: Array<{ score: number; confidence: number; provider: string; weight: number }>): ConsensusReport {
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0) || 1;
  const weightedTruthScore = Math.round(scores.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight);
  const confidence = Math.round(scores.reduce((sum, item) => sum + item.confidence * item.weight, 0) / totalWeight);
  const label = weightedTruthScore < 40 ? "Consensus: likely false" : weightedTruthScore < 70 ? "Consensus: mixed evidence" : "Consensus: likely authentic";

  return {
    label,
    meter: Math.round((weightedTruthScore + confidence) / 2),
    weightedTruthScore,
    confidence,
    basedOn: scores.map((item) => item.provider)
  };
}

function buildTrustGraph(input: AnalysisInput, history: VerificationRecord[]): TrustGraphLink[] {
  const preview = input.content.slice(0, 180);
  return history
    .map((record) => {
      const similarity = tokenSimilarity(preview, record.sourcePreview);
      return {
        hash: record.hash,
        label: record.fileName,
        similarity,
        truthScore: record.truthScore,
        relationship:
          similarity > 72 ? "Near-duplicate narrative cluster" : similarity > 48 ? "Related claim family" : "Weak semantic overlap"
      };
    })
    .filter((record) => record.similarity >= 30)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 4);
}

function buildViralSignal(type: AnalysisInput["type"], trustGraph: TrustGraphLink[], history: VerificationRecord[]): ViralSignal {
  const repeatCount = trustGraph.filter((item) => item.similarity >= 60).length + 1;
  const trendingScore = clamp(repeatCount * 18 + (type === "video" ? 14 : type === "image" ? 10 : 6) + history.length, 12, 99);
  return {
    repeatCount,
    trendingScore,
    status: trendingScore > 75 ? "viral" : trendingScore > 45 ? "watch" : "emerging",
    clusterLabel: trustGraph[0]?.relationship || "New narrative cluster"
  };
}

function buildComparisonVisuals(input: AnalysisInput, suspiciousSignals: string[]): ComparisonVisual[] {
  if (!suspiciousSignals.length) return [];
  return [
    {
      title: "Authentic vs manipulated comparison",
      description: "Prompt pack for side-by-side simulation of authentic and suspicious traits.",
      prompt: `Create a comparison board for a ${input.type} submission showing authentic indicators on the left and suspicious indicators on the right: ${suspiciousSignals.join(", ")}.`
    },
    {
      title: "Evidence overlay storyboard",
      description: "Storyboard prompt that highlights where reviewers should focus first.",
      prompt: `Generate a reviewer storyboard for ${input.type} content that emphasizes: ${suspiciousSignals.slice(0, 3).join(", ")}.`
    }
  ];
}

function levelFromScore(value: number, inverted = false) {
  const score = inverted ? 100 - value : value;
  if (score < 34) return "low" as const;
  if (score < 68) return "medium" as const;
  return "high" as const;
}

function buildExplainabilityFactors({
  truthScore,
  sourceCredibilityScore,
  historyScore,
  similarityScore,
  openSourceScore
}: {
  truthScore: number;
  sourceCredibilityScore: number;
  historyScore: number;
  similarityScore: number;
  openSourceScore: number;
}): ExplainabilityFactor[] {
  const rows: ExplainabilityFactor[] = [
    {
      label: "AI Analysis",
      value: truthScore,
      weight: 0.4,
      impact: truthScore >= 60 ? "positive" : truthScore < 40 ? "negative" : "neutral",
      detail: "Model ensemble confidence after multi-provider reasoning and verification."
    },
    {
      label: "Source Credibility",
      value: sourceCredibilityScore,
      weight: 0.2,
      impact: sourceCredibilityScore >= 60 ? "positive" : sourceCredibilityScore < 40 ? "negative" : "neutral",
      detail: "Source behavior and credibility patterns weighted into the score."
    },
    {
      label: "History",
      value: historyScore,
      weight: 0.15,
      impact: historyScore >= 60 ? "positive" : historyScore < 40 ? "negative" : "neutral",
      detail: "Prior appearances and historical trust performance across stored records."
    },
    {
      label: "Similarity",
      value: similarityScore,
      weight: 0.1,
      impact: similarityScore >= 60 ? "negative" : similarityScore < 40 ? "positive" : "neutral",
      detail: "How strongly the content resembles previously indexed risky narratives."
    },
    {
      label: "Open-Source Signals",
      value: openSourceScore,
      weight: 0.15,
      impact: openSourceScore >= 60 ? "positive" : openSourceScore < 40 ? "negative" : "neutral",
      detail: "Signals aggregated from simulated newsroom, dataset, and community evidence."
    }
  ];

  return rows;
}

function buildFactTimeline({
  input,
  trustGraph,
  viralSignal,
  weightedTruthScore
}: {
  input: AnalysisInput;
  trustGraph: TrustGraphLink[];
  viralSignal: ViralSignal;
  weightedTruthScore: number;
}): FactTimelineStep[] {
  const now = Date.now();
  return [
    {
      stage: "origin",
      title: "Origin captured",
      detail: `${input.fileName || `${input.type} submission`} entered the trust pipeline.`,
      timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
      status: "complete"
    },
    {
      stage: "spread",
      title: "Spread detected",
      detail:
        trustGraph.length > 0
          ? `${trustGraph.length} related narrative links suggest cross-posting or semantic reuse.`
          : "No strong spread history found yet, but the item remains under watch.",
      timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
      status: trustGraph.length > 0 ? "complete" : "watch"
    },
    {
      stage: "flagged",
      title: "Flagged for review",
      detail:
        viralSignal.trendingScore > 60
          ? `Viral pressure reached ${viralSignal.trendingScore} and triggered an elevated moderation posture.`
          : "The item entered analyst review because early risk signals crossed the caution threshold.",
      timestamp: new Date(now - 1000 * 60 * 4).toISOString(),
      status: "complete"
    },
    {
      stage: "verified",
      title: weightedTruthScore < 40 ? "Verified as high-risk" : weightedTruthScore < 70 ? "Verified with caution" : "Verified as likely authentic",
      detail:
        weightedTruthScore < 40
          ? "The final trust decision classifies this content as likely misinformation."
          : weightedTruthScore < 70
            ? "The final trust decision remains mixed and should be treated cautiously."
            : "The final trust decision leans toward authenticity with continued provenance monitoring.",
      timestamp: new Date(now).toISOString(),
      status: "active"
    }
  ];
}

export async function runAnalysis(input: AnalysisInput, history: VerificationRecord[] = []): Promise<AnalysisResult> {
  const contentHash = hashContent([ANALYSIS_REVISION, input.type, input.url?.trim().toLowerCase() || "", input.content].join(":"));
  const language = detectLanguageSignal(input);
  const preprocessing = {
    contentHash,
    mimeType: input.mimeType || (input.type === "text" ? "text/plain" : input.type === "image" ? "image/*" : "video/*"),
    byteLength: input.content.length,
    metadata: unique([input.fileName || `${input.type}-submission`, input.mimeType || "", `type:${input.type}`]).filter(Boolean),
    sampledFrames: input.type === "video" ? 6 : input.type === "image" ? 1 : 0,
    language
  };

  const modelBreakdown = await runAiOrchestration(input, history);

  const consensus = buildConsensus(
    modelBreakdown.map((item) => ({
      score: item.truthScore,
      confidence: item.confidence,
      provider: item.provider,
      weight: item.weight
    }))
  );

  const trustGraph = buildTrustGraph(input, history);
  const viralSignal = buildViralSignal(input.type, trustGraph, history);
  const claimVerification = await analyzeClaimVerification(input, history);
  const openSourceSignals = await collectOpenSourceSignals(input, history, claimVerification);
  const mediaAnalysis = safely(() => buildMediaAnalysis(input.imageUrl, input.videoUrl), { image: null, video: null });
  const aiDetection = safely(() => buildAIDetection(input.content, input.imageUrl), { text: null, image: null });
  const sensitiveContent = safely(() => detectSensitiveContent(input.content), {
    isSensitive: false,
    categories: [],
    severity: "low",
    signals: ["Sensitive-content analysis was unavailable for this input."]
  });
  const unified = buildUnifiedTrustResult({
    aiDetection,
    mediaAnalysis,
    sensitiveContent,
    claimVerification,
    content: input.content,
    inputType: input.type
  });
  const findings = unique(modelBreakdown.flatMap((item) => item.signals)).slice(0, 6);
  const suspiciousSignals = findings.filter((item) => /risk|synthetic|viral|absolute|impersonation|overlap|artifact|manipulation|certainty/i.test(item));
  const manipulationRiskScore = Math.round((100 - consensus.weightedTruthScore + Math.min(viralSignal.trendingScore, 80)) / 2);
  const sourceCredibilityScore = Math.max(10, Math.min(95, consensus.weightedTruthScore - suspiciousSignals.length * 3 + trustGraph.length * 4));
  const historyScore = clamp(64 - trustGraph.length * 9 - (viralSignal.status === "viral" ? 12 : viralSignal.status === "watch" ? 6 : 0), 18, 88);
  const similarityRiskScore = clamp(trustGraph[0]?.similarity || 24, 12, 96);
  const openSourceScore = Math.round(openSourceSignals.reduce((sum, signal) => sum + signal.score, 0) / Math.max(openSourceSignals.length, 1));
  const explanation = modelBreakdown
    .filter((item) => item.role !== "Comparison visual generation plan")
    .slice(0, 3)
    .map((item) => `${item.provider.toUpperCase()}: ${item.summary}`)
    .join(" ");
  const explainability = buildExplainabilityFactors({
    truthScore: consensus.weightedTruthScore,
    sourceCredibilityScore,
    historyScore,
    similarityScore: 100 - similarityRiskScore,
    openSourceScore
  });
  const factTimeline = buildFactTimeline({
    input,
    trustGraph,
    viralSignal,
    weightedTruthScore: consensus.weightedTruthScore
  });

  return {
    truthScore: consensus.weightedTruthScore,
    confidence: consensus.confidence,
    executiveSummary:
      consensus.weightedTruthScore < 40
        ? "Multiple AI systems align on a high-risk verdict with misinformation or manipulation signals."
        : consensus.weightedTruthScore < 70
          ? "The model ensemble is split, so this result should be treated as cautionary rather than final."
          : "The ensemble leans toward authenticity, though provenance checks still strengthen trust.",
    explanation,
    findings: findings.length ? findings : ["No strong cross-model findings were surfaced."],
    suspiciousSignals: suspiciousSignals.length ? suspiciousSignals : ["No major high-risk markers dominated the ensemble output."],
    detectedClaims: [input.content.replace(/\s+/g, " ").trim().slice(0, 220)],
    modelBreakdown,
    preprocessing,
    consensus,
    trustFingerprint: {
      truthScore: consensus.weightedTruthScore,
      manipulationRisk: levelFromScore(manipulationRiskScore),
      sourceCredibility: levelFromScore(sourceCredibilityScore),
      aiConsensus: consensus.meter,
      similarMatches: trustGraph.length,
      confidence: consensus.confidence,
      fingerprintId: contentHash.slice(0, 16).toUpperCase()
    },
    trustGraph,
    viralSignal,
    comparisonVisuals: buildComparisonVisuals(input, findings),
    openSourceSignals,
    explainability,
    factTimeline,
    mediaAnalysis,
    aiDetection,
    sensitiveContent,
    claimVerification,
    unified
  };
}
