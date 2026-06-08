import { NextResponse } from "next/server";
import { AnalysisInput, ContentType } from "@/lib/types";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { getPrincipalFromRequest } from "@/server/middlewares/auth";
import { validateAnalyzeRequest } from "@/server/middlewares/validate-request";
import { resolveSqlUserIdentity, saveProfileHistoryEntry } from "@/server/services/profile-history";
import { readJsonBody } from "@/server/utils/read-json";
import { analyzeInput } from "@/server/services/trust-analysis/engine";

type AnalyzePayload = Partial<AnalysisInput> & {
  contentType?: ContentType;
  input?: string;
  demoMode?: boolean;
};

function normalizeRequest(body: AnalyzePayload): AnalysisInput {
  const type = body.type || body.contentType || "text";

  return {
    type,
    content: body.content || body.input || body.url || body.videoUrl || body.imageUrl || "",
    url: typeof body.url === "string" ? body.url : undefined,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : undefined,
    fileName: typeof body.fileName === "string" ? body.fileName : undefined,
    mimeType: typeof body.mimeType === "string" ? body.mimeType : undefined,
    size: typeof body.size === "number" ? body.size : undefined,
    demoMode: body.demoMode,
    creatorId: body.creatorId,
    creatorName: body.creatorName
  };
}

export async function handleAnalyze(request: Request) {
  try {
    console.log("API HIT");
    const limited = applyRouteRateLimit(request, "analyze", 50);
    if (limited) {
      return limited;
    }

    const parsed = await readJsonBody<AnalyzePayload>(request);
    if (parsed.error) {
      return parsed.error;
    }

    const normalized = normalizeRequest(parsed.data || {});
    console.log("ANALYZE INPUT:", normalized.content || normalized.url || normalized.imageUrl || normalized.videoUrl || "");

    const validationError = validateAnalyzeRequest(normalized);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await analyzeInput(normalized);

    const principal = getPrincipalFromRequest(request);
    if (principal && principal.source !== "guest") {
      const identity = resolveSqlUserIdentity(principal.id);
      if (identity) {
        await saveProfileHistoryEntry(identity, result).catch((historyError) => {
          console.error("[/api/analyze] history save failed", historyError);
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.error("[/api/analyze] ERROR", message);
    return NextResponse.json({
      score: 50,
      category: "Suspicious",
      color: "yellow",
      reason: "Limited data available",
      details: [message],
      tags: ["Limited data available"],
      features: {
        hasSuspiciousLinks: false,
        hasUrgencyWords: false,
        hasAllCaps: false,
        hasRepeatedText: false,
        hasPhishingKeywords: false,
        hasViralMisinformationPattern: false,
        hasSuspiciousClaimLanguage: false,
        hasCredentialBait: false,
        hasCredibleSource: false,
        hasPublicFigureClaim: false,
        hasPoliticalClaim: false,
        hasHealthClaim: false,
        hasMajorEventClaim: false,
        requiresVerification: false
      },
      simpleOutput: {
        score: 50,
        category: "Suspicious",
        color: "yellow",
        reason: "Limited data available",
        features: {
          hasSuspiciousLinks: false,
          hasUrgencyWords: false,
          hasAllCaps: false,
          hasRepeatedText: false,
          hasPhishingKeywords: false,
          hasViralMisinformationPattern: false,
          hasSuspiciousClaimLanguage: false,
          hasCredentialBait: false,
          hasCredibleSource: false,
          hasPublicFigureClaim: false,
          hasPoliticalClaim: false,
          hasHealthClaim: false,
          hasMajorEventClaim: false,
          requiresVerification: false
        },
        tags: ["Limited data available"],
        details: [message]
      },
      trustScore: 50,
      risk: "medium",
      credibility: "low",
      consensus: 50,
      matches: 0,
      confidence: 25,
      explanation: "Analysis could not complete with full live data.",
      sources: { groq: 0, hf: 0, gpt: 0, gemma: 0 },
      txHash: "",
      blockchainStatus: "queued",
      creator: {
        creatorId: "system",
        displayName: "TruthChain-X",
        credibilityScore: 50,
        riskLevel: "medium",
        verifiedBadge: true,
        totalUploads: 0,
        verifiedCount: 0,
        flaggedCount: 0,
        contentHistory: [],
        historySummary: "Fallback response",
        blockchainIdentityId: "SYSTEM",
        identityStatus: "queued"
      },
      record: {
        id: "fallback",
        hash: "fallback",
        type: "text",
        fileName: "fallback",
        creatorId: "system",
        creatorProfile: {
          creatorId: "system",
          displayName: "TruthChain-X",
          credibilityScore: 50,
          riskLevel: "medium",
          verifiedBadge: true,
          totalUploads: 0,
          verifiedCount: 0,
          flaggedCount: 0,
          contentHistory: [],
          historySummary: "Fallback response",
          blockchainIdentityId: "SYSTEM",
          identityStatus: "queued"
        },
        truthScore: 50,
        confidence: 25,
        executiveSummary: "Limited data available",
        explanation: "Limited data available",
        findings: [message],
        suspiciousSignals: [],
        detectedClaims: [],
        modelBreakdown: [],
        preprocessing: { contentHash: "fallback", mimeType: "text/plain", byteLength: 0, metadata: [], sampledFrames: 0 },
        consensus: { label: "SUSPICIOUS", meter: 50, weightedTruthScore: 50, confidence: 25, basedOn: [message] },
        trustFingerprint: { truthScore: 50, manipulationRisk: "medium", sourceCredibility: "low", aiConsensus: 25, similarMatches: 0, confidence: 25, fingerprintId: "fallback" },
        trustGraph: [],
        viralSignal: { repeatCount: 0, trendingScore: 50, status: "watch", clusterLabel: "SUSPICIOUS" },
        comparisonVisuals: [],
        openSourceSignals: [],
        explainability: [],
        factTimeline: [],
        mediaAnalysis: { image: null, video: null },
        aiDetection: { text: null, image: null },
        sensitiveContent: { isSensitive: false, categories: [], severity: "low", signals: [message] },
        claimVerification: {
          claims: [],
          claimStatus: "NotApplicable",
          claimDetected: false,
          verificationRequired: false,
          categories: [],
          suspiciousClaimPatterns: [],
          trustedContextDetected: false,
          credibleSourcePresent: false,
          noTrustedSource: false,
          verified: false,
          sourcesFound: 0,
          trustedSourcesCount: 0,
          verificationScore: 0,
          verdict: "not_applicable",
          confidence: 25,
          checkedLive: false,
          query: "",
          trustedSources: [],
          factCheckHits: [],
          tags: [],
          reason: "Limited data available",
          summary: message,
          explanation: [message]
        },
        unified: { score: 50, category: "SUSPICIOUS", color: "yellow", reason: "Limited data available", safeScore: 50, unsafeScore: 50, safeReasons: [], unsafeReasons: [message], features: [] },
        timestamp: new Date().toISOString(),
        firstVerifiedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        occurrenceCount: 1,
        previouslyVerified: false,
        blockchainStatus: "queued",
        transactionHash: "",
        sourcePreview: ""
      }
    });
  }
}
