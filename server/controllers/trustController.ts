import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";

export async function handleTrustLookup(request: Request, hash: string) {
  const limited = applyRouteRateLimit(request, "trust-lookup", 120);
  if (limited) return limited;

  const record = await findVerificationByHash(hash);
  if (!record) {
    return NextResponse.json({ hash, found: false, message: "Trust fingerprint not found." }, { status: 404 });
  }

  return NextResponse.json({
    hash,
    found: true,
    trustScore: record.truthScore,
    confidence: record.confidence,
    fingerprint: record.trustFingerprint,
    consensus: record.consensus,
    blockchain: {
      status: record.blockchainStatus,
      transactionHash: record.transactionHash
    },
    timestamps: {
      firstVerifiedAt: record.firstVerifiedAt,
      lastVerifiedAt: record.lastVerifiedAt
    }
  });
}
