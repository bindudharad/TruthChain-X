import { NextResponse } from "next/server";
import { listCreatorProfiles, listVerifications } from "@/lib/db";

export async function GET() {
  const [records, creators] = await Promise.all([listVerifications(), listCreatorProfiles()]);

  const contentAlerts = records
    .filter((record) => record.truthScore < 40)
    .slice(0, 4)
    .map((record) => ({
      id: `content-${record.id}`,
      title: "Fake content detected",
      detail: `${record.fileName} scored ${record.truthScore}% and was flagged for high-risk distribution.`,
      level: "danger" as const,
      createdAt: record.lastVerifiedAt
    }));

  const creatorAlerts = creators
    .filter((creator) => creator.credibilityScore < 45)
    .slice(0, 3)
    .map((creator) => ({
      id: `creator-${creator.creatorId}`,
      title: "High-risk creator activity",
      detail: `${creator.displayName} dropped to ${creator.credibilityScore}% credibility.`,
      level: "warning" as const,
      createdAt: new Date().toISOString()
    }));

  return NextResponse.json({
    alerts: [...contentAlerts, ...creatorAlerts].slice(0, 6)
  });
}
