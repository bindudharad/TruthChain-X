import { NextResponse } from "next/server";
import { listCreatorProfiles, listVerifications } from "@/lib/db";

export async function GET() {
  const [records, creators] = await Promise.all([listVerifications(), listCreatorProfiles()]);

  const riskTrend = records
    .slice()
    .reverse()
    .map((record) => ({
      timestamp: record.timestamp,
      riskScore: 100 - record.truthScore
    }));

  const distribution = [
    { label: "High risk", value: records.filter((record) => record.truthScore < 40).length },
    { label: "Warning", value: records.filter((record) => record.truthScore >= 40 && record.truthScore < 70).length },
    { label: "Trusted", value: records.filter((record) => record.truthScore >= 70).length }
  ];

  const topRiskCreators = creators
    .slice()
    .sort((a, b) => a.credibilityScore - b.credibilityScore || b.flaggedCount - a.flaggedCount)
    .slice(0, 5)
    .map((creator) => ({
      creatorId: creator.creatorId,
      displayName: creator.displayName,
      credibilityScore: creator.credibilityScore,
      flaggedCount: creator.flaggedCount
    }));

  return NextResponse.json({
    totals: {
      highRiskContent: distribution[0].value,
      averageTrust: records.length ? Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / records.length) : 0,
      trackedCreators: creators.length
    },
    riskTrend,
    distribution,
    topRiskCreators
  });
}
