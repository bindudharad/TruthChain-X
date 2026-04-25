import { ClaimVerificationSummary, SpamFeatures } from "@/lib/types";

export function detectFeatures(input: string, verification?: ClaimVerificationSummary | null): SpamFeatures {
  const text = input.toLowerCase();
  const claimCategories = verification?.categories || [];

  return {
    hasSuspiciousLinks: /(http|https):\/\/[^ ]+/.test(text),
    hasUrgencyWords:
      /(urgent|verify now|act fast|limited time|urgent action required|limited offer|share before deleted|act now)/.test(text) ||
      /\b(verify|login|password|account)\b.*\b(now|immediately|today)\b/.test(text),
    hasAllCaps: /[A-Z]{5,}/.test(input),
    hasRepeatedText: /(.)\1{4,}/.test(input),
    hasPhishingKeywords: /(login|password|otp|bank|account|verify|reset password|confirm identity)/.test(text),
    hasViralMisinformationPattern: /(breaking|shocking|share before deleted|viral truth|must watch|secret exposed)/.test(text),
    hasSuspiciousClaimLanguage: /(sources say|reports claim|it is being said|rumor has it|secretly|allegedly|unconfirmed)/.test(text),
    hasCredentialBait: /(login|verify account|bank account|enter password|confirm identity|reset password)/.test(text),
    hasCredibleSource: !!verification?.credibleSourcePresent,
    hasPublicFigureClaim: claimCategories.includes("public-figure"),
    hasPoliticalClaim: claimCategories.includes("politics"),
    hasHealthClaim: claimCategories.includes("health"),
    hasMajorEventClaim: claimCategories.includes("major-event"),
    requiresVerification: !!verification?.verificationRequired
  };
}
