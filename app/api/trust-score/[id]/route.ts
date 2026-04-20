import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";
import { requirePlatformAccess } from "@/lib/platform";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = requirePlatformAccess(request);
  if (access.error) return access.error;

  const { id } = await params;
  const record = await findVerificationByHash(id);

  if (!record) {
    return NextResponse.json({ id, found: false, message: "Trust score not found." }, { status: 404 });
  }

  return NextResponse.json({
    id,
    found: true,
    trustScore: record.truthScore,
    fingerprint: record.trustFingerprint,
    confidence: record.confidence,
    consensus: record.consensus,
    blockchainStatus: record.blockchainStatus,
    transactionHash: record.transactionHash
  });
}
