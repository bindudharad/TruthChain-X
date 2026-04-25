import { saveVerification } from "@/lib/db";
import { demoSamples } from "@/lib/sample-data";
import { hashContent } from "@/lib/hashing";
import { createBaseCreatorProfile, updateCreatorReputation } from "@/lib/reputation";

async function main() {
  const now = new Date().toISOString();
  const hash = hashContent(`text:${demoSamples.text}`);
  const creator = updateCreatorReputation(createBaseCreatorProfile("creator_demo", "Demo Creator", false), {
    hash,
    truthScore: 23,
    fileName: "viral-health-claim.txt"
  });
  await saveVerification({
    id: "demo-text-1",
    hash,
    type: "text",
    fileName: "viral-health-claim.txt",
    creatorId: creator.creatorId,
    creatorProfile: creator,
    truthScore: 23,
    confidence: 88,
    executiveSummary: "The ensemble agrees that this claim is high-risk and likely misinformation.",
    explanation: "The claim uses urgency and miracle framing without credible sourcing.",
    findings: ["No trusted source reference detected."],
    suspiciousSignals: ["Viral forwarding language", "Unsupported medical certainty"],
    detectedClaims: [demoSamples.text],
    modelBreakdown: [
      {
        provider: "groq",
        model: "demo-groq-fastlane",
        role: "Fast triage and summarization",
        verdict: "fake",
        truthScore: 28,
        confidence: 70,
        summary: "Rapid triage flags this as a viral health scare.",
        signals: ["viral framing detected"],
        latencyMs: 132,
        usedLiveApi: false,
        weight: 1.1
      },
      {
        provider: "openrouter",
        model: "demo-gpt-oss",
        role: "Deep reasoning and explanation",
        verdict: "fake",
        truthScore: 21,
        confidence: 85,
        summary: "Reasoning detects unsupported certainty and missing evidence.",
        signals: ["absolute certainty without nuance"],
        latencyMs: 421,
        usedLiveApi: false,
        weight: 1.4
      }
    ],
    preprocessing: {
      contentHash: hash,
      mimeType: "text/plain",
      byteLength: demoSamples.text.length,
      metadata: ["viral-health-claim.txt", "type:text"],
      sampledFrames: 0
    },
    consensus: {
      label: "Consensus: likely false",
      meter: 56,
      weightedTruthScore: 23,
      confidence: 88,
      basedOn: ["groq", "openrouter", "gemma"]
    },
    trustFingerprint: {
      truthScore: 23,
      manipulationRisk: "high",
      sourceCredibility: "low",
      aiConsensus: 56,
      similarMatches: 0,
      confidence: 88,
      fingerprintId: hash.slice(0, 16).toUpperCase()
    },
    trustGraph: [],
    viralSignal: {
      repeatCount: 1,
      trendingScore: 73,
      status: "watch",
      clusterLabel: "Health misinformation cluster"
    },
    comparisonVisuals: [
      {
        title: "Authentic vs manipulated comparison",
        description: "Prompt pack for side-by-side simulation of authentic and suspicious traits.",
        prompt: "Create a comparison board for miracle-cure misinformation."
      }
    ],
    openSourceSignals: [
      {
        id: "seed-news",
        kind: "news",
        title: "Trusted newsroom mismatch",
        summary: "No matching trusted reporting coverage was found for the seeded medical claim.",
        score: 28,
        confidence: 74,
        stance: "challenges",
        source: "Open newsroom feeds",
        url: "https://example.com/open-news-signals"
      },
      {
        id: "seed-dataset",
        kind: "dataset",
        title: "Dataset overlap",
        summary: "The seeded claim shape resembles common benchmark examples of health misinformation.",
        score: 34,
        confidence: 79,
        stance: "challenges",
        source: "Benchmark trust datasets",
        url: "https://example.com/public-trust-datasets"
      },
      {
        id: "seed-community",
        kind: "community",
        title: "Community trust signal",
        summary: "Community-style moderation signals are mixed but cautious around the seeded claim.",
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
      { stage: "origin", title: "Origin captured", detail: "The seeded claim entered the trust pipeline.", timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), status: "complete" },
      { stage: "spread", title: "Spread detected", detail: "The narrative profile resembles a health misinformation cluster under watch.", timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), status: "complete" },
      { stage: "flagged", title: "Flagged for review", detail: "Risk signals crossed the threshold for active moderation review.", timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), status: "complete" },
      { stage: "verified", title: "Verified as high-risk", detail: "The final trust decision classifies the seeded content as likely misinformation.", timestamp: now, status: "active" }
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
      suspiciousClaimPatterns: ["Viral framing detected", "High verification required"],
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
      tags: ["High Verification Required", "Unverified Claim", "No Trusted Sources Found", "Real-world claim not confirmed", "Viral Misinformation Pattern"],
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
      safeReasons: [],
      unsafeReasons: ["Contains urgency language.", "Contains credential or login-risk wording.", "Scam-oriented language detected."],
      features: [
        { id: "urgency-pattern", label: "Urgency pattern", weight: 15, source: "text", polarity: "unsafe" },
        { id: "phishing-keyword", label: "Phishing keyword", weight: 20, source: "text", polarity: "unsafe" },
        { id: "scam-content", label: "Scam keyword", weight: 20, source: "sensitive", polarity: "unsafe" }
      ]
    },
    timestamp: now,
    firstVerifiedAt: now,
    lastVerifiedAt: now,
    occurrenceCount: 1,
    previouslyVerified: false,
    blockchainStatus: "queued",
    transactionHash: "demo-seeded-text",
    sourcePreview: demoSamples.text
  });
}

main();
