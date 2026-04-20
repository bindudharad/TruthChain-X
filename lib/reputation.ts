import { createHash } from "crypto";
import { CreatorProfile, VerificationRecord } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function riskFromCredibility(score: number): CreatorProfile["riskLevel"] {
  if (score < 40) return "high";
  if (score < 70) return "medium";
  return "low";
}

export function normalizeCreatorId(creatorId: string) {
  return creatorId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "creator_demo";
}

export function createBaseCreatorProfile(creatorId: string, displayName: string, confirmedIdentity: boolean): CreatorProfile {
  const normalizedCreatorId = normalizeCreatorId(creatorId);
  return {
    creatorId: normalizedCreatorId,
    displayName,
    credibilityScore: 62,
    riskLevel: "medium",
    verifiedBadge: false,
    totalUploads: 0,
    verifiedCount: 0,
    flaggedCount: 0,
    contentHistory: [],
    historySummary: "New creator profile. Reputation will adapt as more content is verified.",
    blockchainIdentityId: createHash("sha256").update(normalizedCreatorId).digest("hex").slice(0, 16).toUpperCase(),
    identityStatus: confirmedIdentity ? "confirmed" : "queued"
  };
}

export function updateCreatorReputation(existing: CreatorProfile, record: Pick<VerificationRecord, "hash" | "truthScore" | "fileName">) {
  const positiveDelta = record.truthScore >= 70 ? 8 : record.truthScore >= 40 ? 1 : -9;
  const credibilityScore = clamp(existing.credibilityScore + positiveDelta, 8, 98);
  const verifiedCount = existing.verifiedCount + (record.truthScore >= 70 ? 1 : 0);
  const flaggedCount = existing.flaggedCount + (record.truthScore < 40 ? 1 : 0);
  const totalUploads = existing.totalUploads + 1;
  const verifiedBadge = credibilityScore >= 80 && flaggedCount <= 1;

  return {
    ...existing,
    credibilityScore,
    riskLevel: riskFromCredibility(credibilityScore),
    verifiedBadge,
    totalUploads,
    verifiedCount,
    flaggedCount,
    contentHistory: [record.hash, ...existing.contentHistory.filter((item) => item !== record.hash)].slice(0, 8),
    historySummary:
      flaggedCount > verifiedCount
        ? `${existing.displayName} has a risky publishing pattern with more flagged than trusted submissions.`
        : verifiedCount > 0
          ? `${existing.displayName} has ${verifiedCount} trusted items and ${flaggedCount} flagged items on record.`
          : `${existing.displayName} is still building credibility across early submissions.`
  };
}
