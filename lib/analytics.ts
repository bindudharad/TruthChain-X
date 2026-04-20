import { AnalyticsReport, CreatorProfile, UsageSnapshot, VerificationRecord } from "@/lib/types";

export function buildAnalyticsReport(records: VerificationRecord[], creators: CreatorProfile[], usage: UsageSnapshot[]): AnalyticsReport {
  const verifications = records.length;
  const averageTruthScore = verifications
    ? Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / verifications)
    : 0;
  const flaggedContent = records.filter((record) => record.truthScore < 40).length;

  const distribution = [
    { label: "Likely fake", value: records.filter((record) => record.truthScore < 40).length },
    { label: "Needs review", value: records.filter((record) => record.truthScore >= 40 && record.truthScore < 70).length },
    { label: "Likely real", value: records.filter((record) => record.truthScore >= 70).length }
  ];

  const trustTrend = records
    .slice()
    .reverse()
    .map((record) => ({
      timestamp: record.timestamp,
      score: record.truthScore
    }));

  const topRiskCreators = creators
    .slice()
    .sort((left, right) => left.credibilityScore - right.credibilityScore || right.flaggedCount - left.flaggedCount)
    .slice(0, 5)
    .map((creator) => ({
      creatorId: creator.creatorId,
      displayName: creator.displayName,
      credibilityScore: creator.credibilityScore,
      flaggedCount: creator.flaggedCount,
      verifiedBadge: creator.verifiedBadge
    }));

  const hotspotMap = new Map<string, number>();
  for (const record of records) {
    const region = record.type === "image" ? "Europe" : record.type === "video" ? "North America" : "South Asia";
    hotspotMap.set(region, (hotspotMap.get(region) || 0) + Math.max(12, 100 - record.truthScore));
  }

  const hotspotRegions = Array.from(hotspotMap.entries()).map(([region, intensity]) => ({
    region,
    intensity: Math.min(100, intensity)
  }));

  const freeTierRequests = usage.filter((entry) => entry.plan === "free").length;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      verifications,
      creators: creators.length,
      flaggedContent,
      averageTruthScore
    },
    distribution,
    trustTrend,
    topRiskCreators,
    hotspotRegions,
    monetization: {
      apiRequestsTracked: usage.length,
      freeTierUtilization: freeTierRequests,
      enterpriseReady: usage.some((entry) => entry.plan === "enterprise")
    }
  };
}
