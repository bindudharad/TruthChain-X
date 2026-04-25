import { NextResponse } from "next/server";
import { AnalysisInput } from "@/lib/types";
import { buildPhishingAssessment } from "@/lib/url-analysis";
import { buildWeightedSummary } from "@/services/ensemble";
import { searchSimilarContent } from "@/services/similarity/engine";
import { buildUnifiedTrustResult } from "@/services/trust-intelligence";
import { detectFeatures } from "@/lib/featureDetector";
import { calculateScore } from "@/lib/scoringEngine";
import { getCategory, getColor } from "@/lib/category";
import { generateDetailedExplanation, generateReason } from "@/lib/reason";
import { verifyClaim } from "@/lib/factCheck";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/Scan";
import { validateAnalyzeRequest } from "@/server/middlewares/validate-request";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { processContentAnalysis } from "@/server/services/pipeline/content-pipeline";
import { readJsonBody } from "@/server/utils/read-json";

export async function handleAnalyze(request: Request) {
  try {
    console.log("API HIT");
    const limited = applyRouteRateLimit(request, "analyze", 50);
    if (limited) return limited;

    const parsed = await readJsonBody<
      | (AnalysisInput & { contentType?: "text" | "image"; demoMode?: boolean })
      | { contentType: "text" | "image"; content?: string; url?: string; fileName?: string; demoMode?: boolean }
    >(request);
    if (parsed.error) return parsed.error;

    const body = parsed.data as
      | (AnalysisInput & { contentType?: "text" | "image"; demoMode?: boolean })
      | { contentType: "text" | "image"; content?: string; url?: string; fileName?: string; demoMode?: boolean };
    const requestBody = body as Partial<AnalysisInput> & {
      contentType?: "text" | "image";
      demoMode?: boolean;
      fileName?: string;
      content?: string;
      input?: string;
      url?: string;
      imageUrl?: string;
      videoUrl?: string;
    };

    const normalized: AnalysisInput = {
      type: requestBody.type || requestBody.contentType || "text",
      content: requestBody.content || requestBody.input || requestBody.url || "",
      url: typeof requestBody.url === "string" ? requestBody.url : undefined,
      imageUrl: typeof requestBody.imageUrl === "string" ? requestBody.imageUrl : undefined,
      videoUrl: typeof requestBody.videoUrl === "string" ? requestBody.videoUrl : undefined,
      fileName: requestBody.fileName,
      demoMode: requestBody.demoMode,
      creatorId: requestBody.creatorId,
      creatorName: requestBody.creatorName
    };
    console.log("ANALYZE INPUT:", normalized.content || normalized.url || normalized.imageUrl || normalized.videoUrl || "");

    const error = validateAnalyzeRequest(normalized);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (dbConnectError) {
      console.error("Mongo connect failed, continuing with analysis:", dbConnectError);
    }
    const record = await processContentAnalysis(normalized);
    const summary = buildWeightedSummary(record.modelBreakdown, record.trustFingerprint.similarMatches, record.explanation);
    const similarity = await searchSimilarContent({
      type: normalized.type,
      content: normalized.url ? `${normalized.url}\n${normalized.content}` : normalized.content,
      currentHash: record.hash,
      demoMode: normalized.demoMode,
      limit: 3
    });
    const phishingAssessment = buildPhishingAssessment({
      url: normalized.url,
      content: normalized.content,
      truthScore: record.truthScore,
      suspiciousSignals: record.suspiciousSignals,
      similarityMatches: similarity.results
    });
    const normalizedClaimVerification = {
      ...record.claimVerification,
      verdict:
        record.claimVerification.claimStatus === "Verified"
          ? "verified"
          : record.claimVerification.claimStatus === "False"
            ? "misleading"
            : record.claimVerification.claimStatus === "NotApplicable"
              ? "not_applicable"
              : "unverified"
    } as const;

    const unified = buildUnifiedTrustResult({
      phishing: phishingAssessment,
      aiDetection: record.aiDetection,
      mediaAnalysis: record.mediaAnalysis,
      sensitiveContent: record.sensitiveContent,
      claimVerification: normalizedClaimVerification,
      content: normalized.content,
      inputType: normalized.type
    });

    const inputText = normalized.content || normalized.url || normalized.imageUrl || normalized.videoUrl || "";
    const features = detectFeatures(inputText, normalizedClaimVerification);
    let score = calculateScore(features, normalizedClaimVerification, phishingAssessment.phishingRiskScore);
    const factCheckQuery = normalizedClaimVerification.claims?.[0]?.text || inputText;
    const shouldRunFactCheck = Boolean(factCheckQuery.trim()) && (normalizedClaimVerification.claimDetected || normalizedClaimVerification.verificationRequired);
    const factData = shouldRunFactCheck ? await verifyClaim(factCheckQuery) : { totalSources: 0, articles: [] };
    const contradictionKeywords = ["false", "fake", "rumor", "not true", "denied", "debunked", "misleading", "hoax"];
    const contradictionFound =
      normalizedClaimVerification.claimStatus === "False" ||
      factData.articles.some((article) => {
        const content = `${article.title} ${article.description || ""}`.toLowerCase();
        return contradictionKeywords.some((word) => content.includes(word));
      });

    let misinformation = contradictionFound;
    const factReasons: string[] = [];
    let factVerdict: "TRUE" | "FALSE" | "UNVERIFIED" =
      normalizedClaimVerification.claimStatus === "Verified"
        ? "TRUE"
        : normalizedClaimVerification.claimStatus === "False"
          ? "FALSE"
          : "UNVERIFIED";

    if (shouldRunFactCheck && factData.totalSources === 0) {
      misinformation = true;
      score += 30;
      factReasons.push("No trusted sources found for this claim");
      if (factVerdict !== "FALSE") {
        factVerdict = "UNVERIFIED";
      }
    }

    if (shouldRunFactCheck && contradictionFound) {
      misinformation = true;
      score += normalizedClaimVerification.claimStatus === "False" ? 20 : 40;
      factReasons.push("Claim contradicted by real-world sources");
      factVerdict = "FALSE";
    }

    if (!misinformation && shouldRunFactCheck && factData.totalSources > 0) {
      score = Math.max(0, score - 10);
      factVerdict = "TRUE";
    }

    if ((factVerdict === "FALSE" || factVerdict === "UNVERIFIED") && score <= 30) {
      score = 31;
    }

    score = Math.min(score, 100);

    const category = getCategory(score);
    const color = getColor(category);
    const factSummary =
      !shouldRunFactCheck
        ? "No factual claim needed real-time verification."
        : factVerdict === "FALSE"
          ? "Claim contradicted by real-world sources."
          : factVerdict === "TRUE"
            ? `Real-time sources support this claim across ${factData.totalSources} source${factData.totalSources === 1 ? "" : "s"}.`
            : factData.totalSources === 0
              ? "No real-time sources were found for this claim."
              : "Real-time sources were found, but the claim still needs human verification.";
    const reason =
      factVerdict === "FALSE"
        ? "Claim contradicted by real-world sources"
        : factVerdict === "UNVERIFIED" && shouldRunFactCheck
          ? "No trusted sources found for this claim"
          : generateReason(features, score, normalizedClaimVerification);
    const details = [...generateDetailedExplanation(features, normalizedClaimVerification), ...factReasons];
    const tags = Array.from(new Set([
      ...(features.hasCredentialBait || features.hasSuspiciousLinks ? ["Phishing Detected"] : []),
      ...(normalizedClaimVerification.noTrustedSource ? ["No Trusted Sources Found"] : []),
      ...(normalizedClaimVerification.claimDetected ? ["Unverified Claim"] : []),
      ...(factVerdict === "FALSE" ? ["Claim Contradicted"] : []),
      ...(factVerdict === "TRUE" ? ["Verified by Real-time Sources"] : []),
      ...(normalizedClaimVerification.tags || [])
    ]));

    try {
      await connectDB();
      await Scan.create({
        input: inputText,
        inputType: normalized.type,
        score,
        category,
        claimStatus: normalizedClaimVerification.claimStatus || (normalizedClaimVerification.verified ? "Verified" : normalizedClaimVerification.noTrustedSource ? "False" : "Unverified"),
        reasons: [...phishingAssessment.reasons, ...factReasons],
        userId: normalized.creatorId,
        transactionHash: record.transactionHash,
        blockchainStatus: record.blockchainStatus,
        sources: factData.articles.map((article) => ({
          title: article.title,
          url: article.url,
          source: article.source
        }))
      });
      console.log("Saved to DB:", inputText);
    } catch (dbError) {
      console.error("Mongo summary write failed:", dbError);
    }

    return NextResponse.json({
      score,
      category,
      color,
      reason,
      details,
      tags,
      features,
      claims: normalizedClaimVerification.claims || [],
      claimStatus: normalizedClaimVerification.claimStatus || (normalizedClaimVerification.verified ? "Verified" : normalizedClaimVerification.noTrustedSource ? "False" : "Unverified"),
      verification: {
        verified: normalizedClaimVerification.verified,
        confidence: normalizedClaimVerification.confidence,
        sourcesFound: normalizedClaimVerification.sourcesFound,
        trustedSources: normalizedClaimVerification.trustedSourcesCount,
        verdict:
          normalizedClaimVerification.claimStatus === "Verified"
            ? "TRUE"
            : normalizedClaimVerification.claimStatus === "False"
              ? "MISLEADING"
              : "UNVERIFIED",
        summary: normalizedClaimVerification.summary
      },
      factCheck: {
        sourcesFound: factData.totalSources,
        verified: factVerdict === "TRUE",
        verdict: factVerdict,
        contradictionFound,
        summary: factSummary,
        articles: factData.articles
      },
      simpleOutput: {
        score,
        category,
        color,
        reason,
        features,
        tags,
        details
      },
      trustScore: summary.score,
      risk: summary.risk,
      credibility: summary.credibility,
      consensus: summary.consensus,
      matches: summary.matches,
      confidence: summary.confidence,
      explanation: summary.explanation,
      sources: summary.sources,
      unified,
      phishingRiskScore: phishingAssessment.phishingRiskScore,
      riskLevel: phishingAssessment.riskLevel,
      attackType: phishingAssessment.attackType,
      reasons: [...phishingAssessment.reasons, ...factReasons],
      analyzedUrl: phishingAssessment.analyzedUrl,
      similarityScore: phishingAssessment.similarityScore,
      similarMatches: similarity.results,
      aiDetection: record.aiDetection,
      mediaAnalysis: record.mediaAnalysis,
      sensitiveContent: record.sensitiveContent,
      claimVerification: normalizedClaimVerification,
      phishingAssessment,
      txHash: record.transactionHash,
      blockchainStatus: record.blockchainStatus,
      hash: record.hash,
      fingerprintId: record.trustFingerprint.fingerprintId,
      creator: record.creatorProfile,
      record
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.error("[/api/analyze] ERROR", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
