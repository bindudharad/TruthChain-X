import { NextResponse } from "next/server";
import { buildWeightedSummary } from "@/services/ensemble";
import { searchSimilarContent } from "@/services/similarity/engine";
import { processContentAnalysis } from "@/server/services/pipeline/content-pipeline";
import { buildPhishingAssessment } from "@/lib/url-analysis";
import { decodeQRCode } from "@/lib/qr-scanner";
import { QRScanResponse } from "@/lib/types";
import { buildUnifiedTrustResult } from "@/services/trust-intelligence";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/Scan";

export const runtime = "nodejs";

async function extractImagePayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { imageData?: string; mimeType?: string } | null;
    if (!body?.imageData) {
      throw new Error("Upload a QR image or provide imageData.");
    }

    const match = body.imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error("QR imageData must be a valid base64 data URL.");
    }

    return {
      buffer: Buffer.from(match[2], "base64"),
      mimeType: body.mimeType || match[1],
      fileName: "qr-upload"
    };
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    throw new Error("Upload a QR image file.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("QR scan only accepts image uploads.");
  }

  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
    fileName: file.name || "qr-upload"
  };
}

function safeSensitiveCategorySignals(categories: string[]) {
  if (!categories.length) return ["No sensitive categories were detected."];
  return categories.map((category) => `${category} content patterns were detected in the decoded QR payload.`);
}

export async function POST(request: Request) {
  try {
    console.log("API HIT");
    try {
      await connectDB();
    } catch (dbConnectError) {
      console.error("Mongo connect failed for QR scan, continuing:", dbConnectError);
    }
    const payload = await extractImagePayload(request);
    const qr = await decodeQRCode(payload.buffer, payload.mimeType);

    if (!qr.rawData) {
      const response: QRScanResponse = {
        qrContent: "",
        type: "unknown",
        phishing: {
          phishingRiskScore: 72,
          riskLevel: "suspicious",
          attackType: "suspicious-content",
          reasons: ["QR code could not be decoded, so the payload should be treated cautiously."],
          similarityScore: 0
        },
        aiDetection: { text: null, image: null },
        mediaAnalysis: { image: null, video: null },
        sensitiveContent: {
          isSensitive: false,
          categories: [],
          severity: "low",
          signals: ["No payload was decoded from the uploaded QR image."]
        },
        claimVerification: {
          claims: [],
          claimStatus: "NotApplicable",
          claimDetected: false,
          verificationRequired: false,
          categories: [],
          suspiciousClaimPatterns: [],
          trustedContextDetected: false,
          credibleSourcePresent: false,
          noTrustedSource: true,
          verified: false,
          sourcesFound: 0,
          trustedSourcesCount: 0,
          verificationScore: 30,
          verdict: "not_applicable",
          confidence: 60,
          checkedLive: false,
          query: "",
          trustedSources: [],
          factCheckHits: [],
          tags: [],
          reason: "No claim detected",
          summary: "The QR code could not be decoded, so no real-world verification was possible.",
          explanation: ["The QR code could not be decoded, so no claim verification was possible."]
        },
        unified: buildUnifiedTrustResult({
          phishing: {
            phishingRiskScore: 72,
            riskLevel: "suspicious",
            attackType: "suspicious-content",
            reasons: ["QR code could not be decoded, so the payload should be treated cautiously."],
            similarityScore: 0
          },
          content: "",
          inputType: "qr",
          qrDecoded: false
        }),
        finalVerdict: "suspicious",
        explanation: ["The QR image did not decode successfully. Unknown QR payloads should not be opened."],
        canOpen: false
      };

      return NextResponse.json(response);
    }

    const isUrl = qr.type === "url";
    const normalizedUrl = isUrl && !/^https?:\/\//i.test(qr.rawData) ? `https://${qr.rawData}` : qr.rawData;
    const analysisInput = {
      type: "text" as const,
      content: qr.rawData,
      url: isUrl ? normalizedUrl : undefined,
      fileName: payload.fileName || "qr-code-upload.png",
      mimeType: payload.mimeType,
      creatorId: "qr_scanner",
      creatorName: "QR Scanner"
    };

    const record = await processContentAnalysis(analysisInput);
    const summary = buildWeightedSummary(record.modelBreakdown, record.trustFingerprint.similarMatches, record.explanation);
    const similarity = await searchSimilarContent({
      type: "text",
      content: isUrl ? `${normalizedUrl}\n${qr.rawData}` : qr.rawData,
      currentHash: record.hash,
      limit: 3
    });
    const phishing = buildPhishingAssessment({
      url: isUrl ? normalizedUrl : undefined,
      content: qr.rawData,
      truthScore: record.truthScore,
      suspiciousSignals: record.suspiciousSignals,
      similarityMatches: similarity.results
    });
    const unified = buildUnifiedTrustResult({
      phishing,
      aiDetection: record.aiDetection,
      mediaAnalysis: record.mediaAnalysis,
      sensitiveContent: record.sensitiveContent,
      claimVerification: record.claimVerification,
      content: qr.rawData,
      inputType: "qr",
      qrDecoded: true
    });

    const finalVerdict = unified.category === "SPAM" ? "dangerous" : unified.category === "SUSPICIOUS" ? "suspicious" : qr.type === "unknown" ? "suspicious" : "safe";

    const explanation = [
      ...phishing.reasons,
      ...safeSensitiveCategorySignals(record.sensitiveContent.categories),
      ...(record.aiDetection.text?.isLikelyAIGenerated ? ["Decoded text shows strong heuristic signs of AI-generated or templated content."] : []),
      ...(qr.type === "unknown" ? ["The decoded payload could not be classified as a URL or trusted text pattern."] : [])
    ].slice(0, 5);

    const response: QRScanResponse = {
      qrContent: qr.rawData,
      type: qr.type,
      phishing,
      aiDetection: record.aiDetection,
      mediaAnalysis: record.mediaAnalysis,
      sensitiveContent: record.sensitiveContent,
      claimVerification: record.claimVerification,
      unified,
      finalVerdict,
      explanation,
      canOpen: finalVerdict === "safe" && qr.type === "url"
    };

    console.log("QR data:", qr.rawData);
    try {
      await Scan.create({
        input: qr.rawData,
        score: unified.score,
        category: unified.category === "SPAM" ? "Risk" : unified.category === "SUSPICIOUS" ? "Suspicious" : "Safe",
        claimStatus: record.claimVerification.claimStatus || "Unverified",
        reasons: explanation,
        sources: record.claimVerification.trustedSources || []
      });
      console.log("Saved to DB:", qr.rawData);
    } catch (dbWriteError) {
      console.error("QR DB save failed:", dbWriteError);
    }

    return NextResponse.json({
      ...response,
      analysis: {
        score: summary.score,
        confidence: summary.confidence,
        explanation: summary.explanation
      }
    });
  } catch (error) {
    console.error("QR API ERROR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "QR scan failed."
      },
      { status: 500 }
    );
  }
}
