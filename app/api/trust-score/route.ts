import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";
import { hashContent } from "@/lib/hashing";
import { requirePlatformAccess } from "@/lib/platform";

export async function GET(request: Request) {
  const access = requirePlatformAccess(request);
  if (access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const type = searchParams.get("type");
  const content = searchParams.get("content");
  const resolvedHash = hash || (type && content ? hashContent(`${type}:${content}`) : "");

  if (!resolvedHash) {
    return NextResponse.json({ error: "Provide either hash or type + content." }, { status: 400 });
  }

  const record = await findVerificationByHash(resolvedHash);
  if (!record) {
    return NextResponse.json(
      {
        hash: resolvedHash,
        found: false,
        message: "No phishing risk signature found for this content yet."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    hash: resolvedHash,
    found: true,
    trustScore: record.truthScore,
    confidence: record.confidence,
    fingerprint: record.trustFingerprint,
    consensus: record.consensus,
    blockchain: {
      status: record.blockchainStatus,
      transactionHash: record.transactionHash
    },
    creator: {
      id: record.creatorProfile.creatorId,
      name: record.creatorProfile.displayName,
      credibilityScore: record.creatorProfile.credibilityScore,
      verifiedBadge: record.creatorProfile.verifiedBadge
    },
    occurrenceCount: record.occurrenceCount,
    previouslyVerified: record.previouslyVerified,
    timestamps: {
      firstVerifiedAt: record.firstVerifiedAt,
      lastVerifiedAt: record.lastVerifiedAt
    }
  });
}
