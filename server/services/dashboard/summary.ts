import {
  CommunityValidation,
  DashboardAnalyzeResponse,
  DashboardFeedItem,
  DashboardSnapshot,
  DashboardStats,
  DashboardStorageInfo,
  SpamFeatures,
  VerificationRecord
} from "@/lib/types";
import { buildTrendingAlerts, getPersistenceStatus, listVerifications } from "@/lib/db";
import { getCommunityValidation } from "@/lib/community";
import { detectFeatures } from "@/lib/featureDetector";
import { calculateScore } from "@/lib/scoringEngine";
import { getCategory, getColor } from "@/lib/category";
import { generateDetailedExplanation, generateReason } from "@/lib/reason";
import { getCopilotSnapshot } from "@/services/copilot/engine";
import { getGlobalIntelligenceSnapshot } from "@/services/intelligence/engine";

function averageProviderScore(records: VerificationRecord[], provider: "groq" | "openrouter" | "gemma" | "huggingface") {
  const matches = records.flatMap((record) => record.modelBreakdown.filter((item) => item.provider === provider));
  if (!matches.length) return 0;
  return Math.round(matches.reduce((sum, item) => sum + item.truthScore, 0) / matches.length);
}

function buildDashboardFeed(records: VerificationRecord[]): DashboardFeedItem[] {
  return records.slice(0, 10).map((record, index) => ({
    id: `${record.id}-feed`,
    label: record.fileName,
    score: record.truthScore,
    timestamp: record.timestamp,
    status: record.truthScore < 40 ? "high-risk" : record.truthScore < 70 ? "watch" : "trusted",
    channel: ["social", "news", "messaging", "community"][index % 4]
  }));
}

function derivePhishingRisk(record: VerificationRecord, features: SpamFeatures) {
  const baseScore =
    (features.hasSuspiciousLinks ? 26 : 0) +
    (features.hasCredentialBait ? 24 : 0) +
    (features.hasPhishingKeywords ? 18 : 0) +
    (features.hasUrgencyWords ? 10 : 0);
  const phishingRiskScore = Math.max(0, Math.min(100, Math.round(baseScore + (100 - record.truthScore) * 0.28)));
  const riskLevel: "safe" | "suspicious" | "dangerous" =
    phishingRiskScore >= 75 ? "dangerous" : phishingRiskScore >= 40 ? "suspicious" : "safe";
  const attackType: "url-spoofing" | "social-engineering" | "credential-trap" | "suspicious-content" =
    features.hasCredentialBait && features.hasSuspiciousLinks
      ? "credential-trap"
      : features.hasSuspiciousLinks
        ? "url-spoofing"
        : features.hasUrgencyWords || features.hasPhishingKeywords
          ? "social-engineering"
          : "suspicious-content";

  return { phishingRiskScore, riskLevel, attackType };
}

function buildDashboardResult(record: VerificationRecord, history: VerificationRecord[]): DashboardAnalyzeResponse {
  const inputText = `${record.url || ""}\n${record.sourcePreview || ""}`.trim();
  const features = detectFeatures(inputText, record.claimVerification);
  const { phishingRiskScore, riskLevel, attackType } = derivePhishingRisk(record, features);
  const score = calculateScore(features, record.claimVerification, phishingRiskScore);
  const category = getCategory(score);
  const color = getColor(category);
  const reason = generateReason(features, score, record.claimVerification);
  const details = generateDetailedExplanation(features, record.claimVerification);
  const tags = Array.from(new Set([...(record.claimVerification?.tags || []), ...(features.hasCredentialBait || features.hasSuspiciousLinks ? ["Phishing Detected"] : [])]));

  return {
    score,
    category,
    color,
    reason,
    features,
    claims: record.claimVerification.claims || [],
    claimStatus: record.claimVerification.claimStatus || (record.claimVerification.verified ? "Verified" : record.claimVerification.noTrustedSource ? "False" : "Unverified"),
    verification: {
      verified: record.claimVerification.verified,
      confidence: record.claimVerification.confidence,
      sourcesFound: record.claimVerification.sourcesFound,
      trustedSources: record.claimVerification.trustedSourcesCount,
      verdict:
        record.claimVerification.claimStatus === "Verified"
          ? "TRUE"
          : record.claimVerification.claimStatus === "False"
            ? "MISLEADING"
            : "UNVERIFIED",
      summary: record.claimVerification.summary
    },
    simpleOutput: {
      score,
      category,
      color,
      reason,
      features,
      tags,
      details
    },
    details,
    tags,
    trustScore: record.truthScore,
    risk: record.truthScore < 40 ? "high" : record.truthScore < 70 ? "medium" : "low",
    credibility: record.creatorProfile.credibilityScore < 40 ? "low" : record.creatorProfile.credibilityScore < 70 ? "medium" : "high",
    consensus: record.consensus.meter,
    matches: record.trustGraph.length,
    confidence: record.confidence,
    explanation: record.explanation,
    sources: {
      groq: averageProviderScore(history, "groq"),
      hf: averageProviderScore(history, "huggingface"),
      gpt: averageProviderScore(history, "openrouter"),
      gemma: averageProviderScore(history, "gemma")
    },
    txHash: record.transactionHash,
    blockchainStatus: record.blockchainStatus,
    creator: record.creatorProfile,
    record,
    phishingRiskScore,
    riskLevel,
    attackType,
    reasons: Array.from(new Set([...(details || []), ...record.suspiciousSignals])),
    analyzedUrl: record.url,
    similarityScore: record.trustGraph[0]?.similarity ?? 0,
    similarMatches: record.trustGraph.slice(0, 3).map((match, index) => ({
      matchId: `${record.hash}-history-${index}`,
      similarityScore: match.similarity,
      matchedContent: match.label,
      preview: match.label,
      source: "TruthChain",
      url: `/similarity?hash=${match.hash}`,
      caption: match.relationship,
      trustScore: match.truthScore,
      platforms: ["TruthChain"],
      reportCount: 0,
      severity: match.similarity > 80 ? "high" : match.similarity > 60 ? "medium" : "low"
    })),
    aiDetection: record.aiDetection,
    mediaAnalysis: record.mediaAnalysis,
    sensitiveContent: record.sensitiveContent,
    unified: record.unified,
    claimVerification: record.claimVerification
  };
}

function buildDashboardStats(records: VerificationRecord[], result: DashboardAnalyzeResponse, totalAlerts: number): DashboardStats {
  return {
    totalAlerts,
    recentScans: records.length,
    averageScore: Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / Math.max(records.length, 1)),
    lastVerdict: result.category,
    verificationStats: {
      verified: records.filter((record) => record.claimVerification?.verified).length,
      unverified: records.filter((record) => record.claimVerification?.claimDetected && !record.claimVerification?.verified && !record.claimVerification?.noTrustedSource).length,
      misleading: records.filter((record) => record.claimVerification?.noTrustedSource).length,
      liveChecked: records.filter((record) => record.claimVerification?.checkedLive).length
    }
  };
}

export async function buildDashboardSnapshot(hash?: string): Promise<DashboardSnapshot | null> {
  const records = await listVerifications();
  if (!records.length) {
    return null;
  }

  const activeRecord = records.find((record) => record.hash === hash) || records[0];
  const [storage, copilot, intelligence] = await Promise.all([
    getPersistenceStatus(),
    getCopilotSnapshot({ hash: activeRecord.hash }),
    getGlobalIntelligenceSnapshot({ hash: activeRecord.hash })
  ]);
  const result = buildDashboardResult(activeRecord, records);
  const community: CommunityValidation = getCommunityValidation(activeRecord.hash);
  const alerts = buildTrendingAlerts(records);
  const stats = buildDashboardStats(records, result, alerts.length + copilot.alerts.length + intelligence.alerts.length);

  return {
    generatedAt: new Date().toISOString(),
    storage,
    stats,
    result,
    records,
    alerts,
    feed: buildDashboardFeed(records),
    community,
    copilot,
    intelligence
  };
}

export type { DashboardStorageInfo };
