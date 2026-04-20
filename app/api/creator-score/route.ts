import { NextResponse } from "next/server";
import { getCreatorProfile, listVerifications } from "@/lib/db";
import { requirePlatformAccess } from "@/lib/platform";

export async function GET(request: Request) {
  const access = requirePlatformAccess(request);
  if (access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");

  if (!creatorId) {
    return NextResponse.json({ error: "Missing creatorId query parameter." }, { status: 400 });
  }

  const profile = await getCreatorProfile(creatorId);
  if (!profile) {
    return NextResponse.json(
      {
        creatorId,
        found: false,
        message: "Creator profile not found."
      },
      { status: 404 }
    );
  }

  const records = (await listVerifications()).filter((record) => record.creatorId === creatorId).slice(0, 8);

  return NextResponse.json({
    creatorId,
    found: true,
    creator: profile,
    history: records.map((record) => ({
      hash: record.hash,
      fileName: record.fileName,
      truthScore: record.truthScore,
      confidence: record.confidence,
      timestamp: record.timestamp,
      fingerprintId: record.trustFingerprint.fingerprintId
    })),
    analytics: {
      totalUploads: profile.totalUploads,
      averageTruthScore: records.length ? Math.round(records.reduce((sum, record) => sum + record.truthScore, 0) / records.length) : 0,
      latestRisk: profile.riskLevel
    }
  });
}
