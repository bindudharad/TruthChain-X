import { AnalysisInput, ClaimVerificationSummary, VerificationRecord } from "@/lib/types";
import { verifyClaimsRealtime } from "@/lib/realtimeVerifier";

const TRUSTED_CONTEXT_PATTERN =
  /\b(reuters|associated press|ap news|bbc|who|cdc|nih|government|official|fact check|factcheck|icc|espncricinfo|the hindu|indian express|ndtv|google official)\b/i;
const VIRAL_PATTERN = /\b(breaking|shocking|share before deleted|viral truth|must watch|secret exposed)\b/i;
const SUSPICIOUS_CLAIM_PATTERN = /\b(sources say|reports claim|it is being said|rumor has it|allegedly|secretly|unconfirmed)\b/i;

function trustedContextDetected(input: AnalysisInput, text: string) {
  const rawHost = input.url || "";
  return TRUSTED_CONTEXT_PATTERN.test(text) || /(google\.com|bbc\.com|reuters\.com|apnews\.com|who\.int|cdc\.gov|icc-cricket\.com|espncricinfo\.com)/i.test(rawHost);
}

export async function analyzeClaimVerification(input: AnalysisInput, history: VerificationRecord[] = []): Promise<ClaimVerificationSummary> {
  const text = `${input.content || ""} ${input.url || ""}`.trim();
  const realtime = await verifyClaimsRealtime(input, history);
  const hasTrustedContext = trustedContextDetected(input, text);
  const noTrustedSource = realtime.requiresVerification && realtime.trustedSources === 0;
  const verificationRequired = realtime.requiresVerification || VIRAL_PATTERN.test(text) || SUSPICIOUS_CLAIM_PATTERN.test(text);
  const claimDetected = realtime.claims.length > 0;

  if (!verificationRequired && !claimDetected) {
    return {
      claims: [],
      claimStatus: "NotApplicable",
      claimDetected: false,
      verificationRequired: false,
      categories: [],
      suspiciousClaimPatterns: [],
      trustedContextDetected: hasTrustedContext,
      credibleSourcePresent: false,
      noTrustedSource: false,
      verified: false,
      sourcesFound: 0,
      trustedSourcesCount: 0,
      verificationScore: 0,
      verdict: "not_applicable",
      confidence: 72,
      checkedLive: false,
      query: "",
      trustedSources: [],
      factCheckHits: [],
      tags: hasTrustedContext ? ["Trusted Source Mentioned"] : [],
      reason: hasTrustedContext ? "Trusted source context detected" : "No real-world claim detected",
      summary: hasTrustedContext ? "Trusted source context was detected, but no verifiable claim was found." : "The content does not contain a claim that requires real-world verification.",
      explanation: hasTrustedContext
        ? ["Trusted source context was detected, but no real-world claim required verification."]
        : ["The content does not contain a claim that requires external verification."]
    };
  }

  const claimStatus = realtime.verified ? "Verified" : realtime.verdict === "MISLEADING" ? "False" : "Unverified";
  const verdict = claimStatus === "Verified" ? "verified" : claimStatus === "False" ? "misleading" : "unverified";
  const suspiciousClaimPatterns = [
    ...(VIRAL_PATTERN.test(text) ? ["Viral framing detected"] : []),
    ...(SUSPICIOUS_CLAIM_PATTERN.test(text) ? ["Suspicious claim phrasing detected"] : []),
    ...(verificationRequired ? ["High verification required"] : [])
  ];
  const tags = [
    ...(verificationRequired ? ["High Verification Required"] : []),
    ...(VIRAL_PATTERN.test(text) ? ["Viral Misinformation Pattern"] : []),
    ...(claimStatus === "False" ? ["Unverified Claim", "Real-world claim not confirmed"] : []),
    ...(claimStatus === "Unverified" ? ["Unverified Claim"] : []),
    ...(!realtime.verified && realtime.trustedSources === 0 && verificationRequired ? ["No Trusted Sources Found"] : []),
    ...(realtime.verified ? ["Verified by Trusted Sources"] : [])
  ];

  return {
    claims: realtime.claims,
    claimStatus,
    claimDetected,
    verificationRequired,
    categories: realtime.categories,
    suspiciousClaimPatterns,
    trustedContextDetected: hasTrustedContext,
    credibleSourcePresent: realtime.trustedSources > 0,
    noTrustedSource,
    verified: realtime.verified,
    sourcesFound: realtime.sourcesFound,
    trustedSourcesCount: realtime.trustedSources,
    verificationScore: realtime.verificationScore,
    verdict,
    confidence: realtime.confidence,
    checkedLive: realtime.sourceHits.some((hit) => hit.sourceType === "news" || hit.sourceType === "search" || hit.sourceType === "fact-check"),
    query: realtime.claims[0]?.text || "",
    trustedSources: realtime.sourceHits,
    factCheckHits: realtime.factChecks,
    tags,
    reason: realtime.verified
      ? "Trusted source coverage found"
      : hasTrustedContext
        ? "Unverified claim despite trusted source context"
        : realtime.verdict === "MISLEADING"
          ? "No credible source found"
          : "Claim could not be verified",
    summary: realtime.summary,
    explanation: [
      ...(VIRAL_PATTERN.test(text) ? ["Contains viral or sensational framing that often appears in misinformation posts."] : []),
      ...(SUSPICIOUS_CLAIM_PATTERN.test(text) ? ["Uses indirect claim language like 'sources say' or 'reports claim'."] : []),
      ...(hasTrustedContext ? ["Trusted URL or brand context was detected, but it was not treated as proof of truth."] : []),
      ...(realtime.verified ? [`Found ${realtime.trustedSources} trusted source match${realtime.trustedSources === 1 ? "" : "es"} for the claim.`] : ["No credible news coverage or trusted source match was found for the detected claim."]),
      ...(realtime.factChecks.length ? ["Fact-check references were found and included in the verification summary."] : [])
    ]
  };
}
