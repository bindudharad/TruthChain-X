"use client";

import { AnalyzeResponse } from "@/hooks/useDashboardState";
import { demoSamples } from "@/lib/sample-data";

const STARTER_TIMESTAMPS = {
  verified: "2026-04-23T08:00:00.000Z",
  flagged: "2026-04-23T07:56:00.000Z",
  spread: "2026-04-23T07:50:00.000Z",
  origin: "2026-04-23T07:42:00.000Z"
} as const;

export const starterAnalysis: AnalyzeResponse = {
  score: 80,
  category: "Risk",
  color: "red",
  reason: "Unverified viral claim with no trusted sources",
  features: {
    hasSuspiciousLinks: true,
    hasUrgencyWords: true,
    hasAllCaps: false,
    hasRepeatedText: false,
    hasPhishingKeywords: true,
    hasViralMisinformationPattern: true,
    hasSuspiciousClaimLanguage: true,
    hasCredentialBait: true,
    hasCredibleSource: false,
    hasPublicFigureClaim: false,
    hasPoliticalClaim: false,
    hasHealthClaim: true,
    hasMajorEventClaim: false,
    requiresVerification: true
  },
  simpleOutput: {
    score: 80,
    category: "Risk",
    color: "red",
    reason: "Unverified viral claim with no trusted sources",
    features: {
      hasSuspiciousLinks: true,
      hasUrgencyWords: true,
      hasAllCaps: false,
      hasRepeatedText: false,
      hasPhishingKeywords: true,
      hasViralMisinformationPattern: true,
      hasSuspiciousClaimLanguage: true,
      hasCredentialBait: true,
      hasCredibleSource: false,
      hasPublicFigureClaim: false,
      hasPoliticalClaim: false,
      hasHealthClaim: true,
      hasMajorEventClaim: false,
      requiresVerification: true
    },
    tags: ["Phishing Detected", "Unverified Claim", "No Trusted Sources Found", "Real-world claim not confirmed", "Viral Misinformation Pattern"],
    details: ["Contains urgency language.", "No credible news coverage or trusted source match was found."]
  },
  details: ["Contains urgency language.", "No credible news coverage or trusted source match was found."],
  tags: ["Phishing Detected", "Unverified Claim", "No Trusted Sources Found", "Real-world claim not confirmed", "Viral Misinformation Pattern"],
  trustScore: 23,
  risk: "high",
  credibility: "low",
  consensus: 56,
  matches: 0,
  confidence: 88,
  explanation: "The content uses urgency, miracle framing, and unsupported certainty, which are classic misinformation signals.",
  sources: { groq: 28, hf: 23, gpt: 21, gemma: 24 },
  txHash: "demo-seeded-text",
  blockchainStatus: "queued",
  phishingRiskScore: 84,
  riskLevel: "dangerous",
  attackType: "social-engineering",
  reasons: [
    "Uses urgency language to pressure the user into acting quickly.",
    "Requests login credentials or password confirmation.",
    "Open-source corroboration is weak for the core claim."
  ],
  analyzedUrl: "http://amaz0n-security-check.example/login",
  similarityScore: 72,
  similarMatches: [],
  aiDetection: {
    text: {
      aiGeneratedProbability: 78,
      isLikelyAIGenerated: true,
      signals: ["Uses generic transition phrases often seen in templated AI writing.", "Sentence lengths are unusually uniform across the sample."]
    },
    image: null
  },
  mediaAnalysis: {
    image: {
      suspicious: true,
      findings: ["Image URL suggests a login or account-verification interface.", "Image hints at branded UI that may be used for impersonation."],
      sourceUrl: "https://example.com/amazon-login-screenshot.png"
    },
    video: null
  },
  sensitiveContent: {
    isSensitive: true,
    categories: ["scam", "spam"],
    severity: "high",
    signals: ["Scam-oriented urgency or credential prompts were detected.", "Spam-like repetition, multiple links, or mass-marketing language was detected."]
  },
  claimVerification: {
    claims: [{ text: "miracle health claim", type: "health", categories: ["health"], highVerificationRequired: true }],
    claimStatus: "False",
    claimDetected: true,
    verificationRequired: true,
    categories: ["health"],
    suspiciousClaimPatterns: ["Viral framing detected", "Suspicious claim phrasing detected", "High verification required"],
    trustedContextDetected: false,
    credibleSourcePresent: false,
    noTrustedSource: true,
    verified: false,
    sourcesFound: 0,
    trustedSourcesCount: 0,
    verificationScore: 60,
    verdict: "unverified",
    confidence: 82,
    checkedLive: false,
    query: "miracle health claim",
    trustedSources: [],
    factCheckHits: [],
    tags: ["High Verification Required", "Viral Misinformation Pattern", "Unverified Claim", "No Trusted Sources Found", "Real-world claim not confirmed"],
    reason: "No credible source found",
    summary: "No trusted reporting supports this real-world claim.",
    explanation: ["Contains viral or sensational framing that often appears in misinformation posts.", "No credible news coverage or trusted source match was found for the detected claim."]
  },
  unified: {
    score: 84,
    category: "SPAM",
    color: "red",
    reason: "Contains suspicious links and urgency-based language.",
    safeScore: 16,
    unsafeScore: 84,
    safeReasons: ["QR payload decoded successfully."],
    unsafeReasons: ["Contains urgency language.", "Contains credential or login-risk wording.", "Scam-oriented language detected."],
    features: [
      { id: "urgency-pattern", label: "Urgency pattern", weight: 15, source: "text", polarity: "unsafe" },
      { id: "phishing-keyword", label: "Phishing keyword", weight: 20, source: "text", polarity: "unsafe" },
      { id: "scam-content", label: "Scam keyword", weight: 20, source: "sensitive", polarity: "unsafe" }
    ]
  },
  creator: {
    creatorId: "creator_demo",
    displayName: "Demo Creator",
    credibilityScore: 62,
    riskLevel: "medium",
    verifiedBadge: false,
    totalUploads: 1,
    verifiedCount: 0,
    flaggedCount: 1,
    contentHistory: ["demo"],
    historySummary: "Demo Creator is still building credibility and currently has one flagged submission on record.",
    blockchainIdentityId: "DEMOIDENTITY001",
    identityStatus: "queued"
  },
  record: {
    id: "starter",
    hash: "demo",
    type: "text",
    fileName: "viral-health-claim.txt",
    creatorId: "creator_demo",
    creatorProfile: {
      creatorId: "creator_demo",
      displayName: "Demo Creator",
      credibilityScore: 62,
      riskLevel: "medium",
      verifiedBadge: false,
      totalUploads: 1,
      verifiedCount: 0,
      flaggedCount: 1,
      contentHistory: ["demo"],
      historySummary: "Demo Creator is still building credibility and currently has one flagged submission on record.",
      blockchainIdentityId: "DEMOIDENTITY001",
      identityStatus: "queued"
    },
    truthScore: 23,
    confidence: 88,
    executiveSummary: "The ensemble agrees that this claim is high-risk and likely misinformation.",
    explanation: "The claim uses urgency and miracle framing without credible sourcing.",
    findings: ["No trusted source reference detected."],
    suspiciousSignals: ["Viral forwarding language", "Unsupported medical certainty"],
    detectedClaims: [demoSamples.text],
    modelBreakdown: [],
    preprocessing: { contentHash: "demo", mimeType: "text/plain", byteLength: demoSamples.text.length, metadata: ["type:text"], sampledFrames: 0 },
    consensus: { label: "Consensus: likely false", meter: 56, weightedTruthScore: 23, confidence: 88, basedOn: ["groq", "openrouter", "gemma"] },
    trustFingerprint: {
      truthScore: 23,
      manipulationRisk: "high",
      sourceCredibility: "low",
      aiConsensus: 56,
      similarMatches: 0,
      confidence: 88,
      fingerprintId: "DEMO7AE760B20D11"
    },
    trustGraph: [],
    viralSignal: { repeatCount: 1, trendingScore: 73, status: "watch", clusterLabel: "Health misinformation cluster" },
    comparisonVisuals: [],
    openSourceSignals: [
      {
        id: "starter-news",
        kind: "news",
        title: "Trusted newsroom mismatch",
        summary: "No matching coverage was found in simulated trusted reporting feeds for the core medical claim.",
        score: 28,
        confidence: 74,
        stance: "challenges",
        source: "Open newsroom feeds",
        url: "https://example.com/open-news-signals"
      },
      {
        id: "starter-dataset",
        kind: "dataset",
        title: "Dataset overlap",
        summary: "The wording resembles health misinformation entries commonly seen in public benchmark datasets.",
        score: 34,
        confidence: 79,
        stance: "challenges",
        source: "Benchmark trust datasets",
        url: "https://example.com/public-trust-datasets"
      },
      {
        id: "starter-community",
        kind: "community",
        title: "Community trust signal",
        summary: "Community-style moderation signals are cautious because the claim shape looks familiar and unsupported.",
        score: 42,
        confidence: 68,
        stance: "mixed",
        source: "Community moderation signals",
        url: "https://example.com/community-signals"
      }
    ],
    explainability: [
      { label: "AI Analysis", value: 23, weight: 0.4, impact: "negative", detail: "Model ensemble confidence remains low after reasoning and verification." },
      { label: "Source Credibility", value: 31, weight: 0.2, impact: "negative", detail: "Credible sourcing and provenance are weak." },
      { label: "History", value: 48, weight: 0.15, impact: "neutral", detail: "There is not much prior history, so the item remains under watch." },
      { label: "Similarity", value: 34, weight: 0.1, impact: "negative", detail: "Narrative overlap with risky clusters raises concern." },
      { label: "Open-Source Signals", value: 35, weight: 0.15, impact: "negative", detail: "Open-source corroboration is limited and mostly challenging." }
    ],
    factTimeline: [
      { stage: "origin", title: "Origin captured", detail: "The claim entered the trust pipeline from the current upload.", timestamp: STARTER_TIMESTAMPS.origin, status: "complete" },
      { stage: "spread", title: "Spread detected", detail: "The narrative profile resembles a health misinformation cluster already under watch.", timestamp: STARTER_TIMESTAMPS.spread, status: "complete" },
      { stage: "flagged", title: "Flagged for review", detail: "Risk signals crossed the threshold for active moderation review.", timestamp: STARTER_TIMESTAMPS.flagged, status: "complete" },
      { stage: "verified", title: "Verified as high-risk", detail: "The final trust decision classifies the content as likely misinformation.", timestamp: STARTER_TIMESTAMPS.verified, status: "active" }
    ],
    mediaAnalysis: {
      image: {
        suspicious: true,
        findings: ["Image URL suggests a login or account-verification interface.", "Image hints at branded UI that may be used for impersonation."],
        sourceUrl: "https://example.com/amazon-login-screenshot.png"
      },
      video: null
    },
    aiDetection: {
      text: {
        aiGeneratedProbability: 78,
        isLikelyAIGenerated: true,
        signals: ["Uses generic transition phrases often seen in templated AI writing.", "Sentence lengths are unusually uniform across the sample."]
      },
      image: null
    },
    sensitiveContent: {
      isSensitive: true,
      categories: ["scam", "spam"],
      severity: "high",
      signals: ["Scam-oriented urgency or credential prompts were detected.", "Spam-like repetition, multiple links, or mass-marketing language was detected."]
    },
    claimVerification: {
      claims: [{ text: "miracle health claim", type: "health", categories: ["health"], highVerificationRequired: true }],
      claimStatus: "False",
      claimDetected: true,
      verificationRequired: true,
      categories: ["health"],
      suspiciousClaimPatterns: ["Viral framing detected", "Suspicious claim phrasing detected", "High verification required"],
      trustedContextDetected: false,
      credibleSourcePresent: false,
      noTrustedSource: true,
      verified: false,
      sourcesFound: 0,
      trustedSourcesCount: 0,
      verificationScore: 60,
      verdict: "unverified",
      confidence: 82,
      checkedLive: false,
      query: "miracle health claim",
      trustedSources: [],
      factCheckHits: [],
      tags: ["High Verification Required", "Viral Misinformation Pattern", "Unverified Claim", "No Trusted Sources Found", "Real-world claim not confirmed"],
      reason: "No credible source found",
      summary: "No trusted reporting supports this real-world claim.",
      explanation: ["Contains viral or sensational framing that often appears in misinformation posts.", "No credible news coverage or trusted source match was found for the detected claim."]
    },
    unified: {
      score: 84,
      category: "SPAM",
      color: "red",
      reason: "Contains suspicious links and urgency-based language.",
      safeScore: 16,
      unsafeScore: 84,
      safeReasons: ["QR payload decoded successfully."],
      unsafeReasons: ["Contains urgency language.", "Contains credential or login-risk wording.", "Scam-oriented language detected."],
      features: [
        { id: "urgency-pattern", label: "Urgency pattern", weight: 15, source: "text", polarity: "unsafe" },
        { id: "phishing-keyword", label: "Phishing keyword", weight: 20, source: "text", polarity: "unsafe" },
        { id: "scam-content", label: "Scam keyword", weight: 20, source: "sensitive", polarity: "unsafe" }
      ]
    },
    timestamp: STARTER_TIMESTAMPS.verified,
    firstVerifiedAt: STARTER_TIMESTAMPS.verified,
    lastVerifiedAt: STARTER_TIMESTAMPS.verified,
    occurrenceCount: 1,
    previouslyVerified: false,
    blockchainStatus: "queued",
    transactionHash: "demo-seeded-text",
    sourcePreview: demoSamples.text,
    url: "http://amaz0n-security-check.example/login"
  }
};
