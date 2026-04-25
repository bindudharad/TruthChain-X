import { ClaimVerificationSummary, SpamFeatures } from "@/lib/types";

export function generateReason(features: SpamFeatures, score: number, verification?: ClaimVerificationSummary | null) {
  if (verification?.claimStatus === "False") {
    return "Claim conflicts with verified facts";
  }

  if (verification?.claimStatus === "Unverified") {
    return "Claim needs real-world verification";
  }

  if (score <= 30) {
    return "No suspicious patterns detected";
  }

  if (verification?.noTrustedSource && verification.trustedContextDetected) {
    return "Unverified claim despite trusted source";
  }

  if (verification?.noTrustedSource && features.requiresVerification) {
    return "Claim not supported by trusted sources";
  }

  if (verification?.noTrustedSource && features.hasViralMisinformationPattern) {
    return "Unverified viral claim with no trusted sources";
  }

  if (verification?.noTrustedSource) {
    return "Real-world claim not confirmed";
  }

  if (features.hasSuspiciousLinks) {
    return "Contains suspicious external links";
  }

  if (features.hasPhishingKeywords) {
    return "Contains phishing-related keywords";
  }

  if (features.hasUrgencyWords) {
    return "Uses urgency-based scam language";
  }

  if (features.hasAllCaps) {
    return "Uses excessive capital letters";
  }

  return "Multiple suspicious patterns detected";
}

export function generateDetailedExplanation(features: SpamFeatures, verification?: ClaimVerificationSummary | null) {
  const details = [
    ...(features.hasUrgencyWords ? ["Contains urgency language."] : []),
    ...(features.hasSuspiciousLinks ? ["Contains suspicious external links."] : []),
    ...(features.hasPhishingKeywords || features.hasCredentialBait ? ["Contains credential or phishing bait language."] : []),
    ...(features.hasViralMisinformationPattern ? ["Contains viral misinformation-style framing."] : []),
    ...(features.hasSuspiciousClaimLanguage ? ["Uses suspicious claim wording such as 'sources say' or 'reports claim'."] : []),
    ...(features.requiresVerification ? ["The text includes a real-world claim that needs external verification."] : []),
    ...(verification?.noTrustedSource ? ["No credible news coverage or trusted source match was found."] : []),
    ...(verification?.credibleSourcePresent ? ["Trusted source coverage was found for the detected claim."] : [])
  ];

  return details.length ? details : ["No suspicious patterns detected."];
}
