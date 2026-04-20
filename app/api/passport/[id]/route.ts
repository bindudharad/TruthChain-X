import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await findVerificationByHash(id);

  if (!record) {
    return NextResponse.json({ id, found: false, message: "Passport not found." }, { status: 404 });
  }

  return NextResponse.json({
    id,
    found: true,
    summary: {
      fileName: record.fileName,
      hash: record.hash,
      trustScore: record.truthScore,
      confidence: record.confidence,
      fingerprintId: record.trustFingerprint.fingerprintId,
      timestamp: record.firstVerifiedAt,
      lastVerifiedAt: record.lastVerifiedAt,
      blockchainStatus: record.blockchainStatus,
      transactionHash: record.transactionHash,
      explanation: record.explanation,
      creator: record.creatorProfile.displayName
    }
  });
}
