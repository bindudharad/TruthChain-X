import { ClaimVerificationSummary, SpamFeatures } from "@/lib/types";

export function calculateScore(features: SpamFeatures, verification?: ClaimVerificationSummary | null, phishingScore = 0) {
  let score = phishingScore;

  if (features.hasSuspiciousLinks) score += 10;
  if (features.hasPhishingKeywords) score += 8;
  if (features.hasUrgencyWords) score += 10;
  if (features.hasAllCaps) score += 10;
  if (features.hasRepeatedText) score += 10;
  if (features.hasSuspiciousLinks && features.hasPhishingKeywords) score += 10;
  if (features.hasViralMisinformationPattern) score += 12;
  if (features.hasSuspiciousClaimLanguage) score += 10;
  if (features.hasCredentialBait) score += 12;
  if (features.hasCredentialBait && features.hasPhishingKeywords) score += 12;
  if (features.requiresVerification) score += 6;
  if (
    features.hasPublicFigureClaim ||
    features.hasPoliticalClaim ||
    features.hasHealthClaim ||
    features.hasMajorEventClaim
  ) {
    score += 5;
  }

  score += verification?.verificationScore ?? 0;
  if (features.hasUrgencyWords || features.hasCredentialBait) score += 20;
  if (features.hasSuspiciousLinks && !features.hasCredibleSource) score += 10;
  if (verification?.credibleSourcePresent || verification?.verified) score -= 20;
  if (verification?.factCheckHits.length) score -= 12;
  if ((verification?.claimStatus === "Unverified" || verification?.claimStatus === "False") && score <= 30) {
    score = 31;
  }

  return Math.max(0, Math.min(score, 100));
}
