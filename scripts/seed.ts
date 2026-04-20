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
