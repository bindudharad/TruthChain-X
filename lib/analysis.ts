import { AnalysisInput, AnalysisResult, ComparisonVisual, ConsensusReport, TrustGraphLink, VerificationRecord, ViralSignal } from "@/lib/types";
import { tokenSimilarity } from "@/services/ensembleEngine";
import { hashContent } from "@/lib/hashing";
import { runAiOrchestration } from "@/server/services/ensemble/engine";
import { detectLanguageSignal } from "@/lib/language";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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

export async function runAnalysis(input: AnalysisInput, history: VerificationRecord[] = []): Promise<AnalysisResult> {
  const contentHash = hashContent(`${input.type}:${input.content}`);
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
  const findings = unique(modelBreakdown.flatMap((item) => item.signals)).slice(0, 6);
  const suspiciousSignals = findings.filter((item) => /risk|synthetic|viral|absolute|impersonation|overlap|artifact|manipulation|certainty/i.test(item));
  const manipulationRiskScore = Math.round((100 - consensus.weightedTruthScore + Math.min(viralSignal.trendingScore, 80)) / 2);
  const sourceCredibilityScore = Math.max(10, Math.min(95, consensus.weightedTruthScore - suspiciousSignals.length * 3 + trustGraph.length * 4));
  const explanation = modelBreakdown
    .filter((item) => item.role !== "Comparison visual generation plan")
    .slice(0, 3)
    .map((item) => `${item.provider.toUpperCase()}: ${item.summary}`)
    .join(" ");

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
    comparisonVisuals: buildComparisonVisuals(input, findings)
  };
}
