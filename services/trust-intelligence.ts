import {
  AIDetectionSummary,
  ClaimVerificationSummary,
  MediaAnalysisSummary,
  PhishingAssessment,
  SensitiveContentSummary,
  UnifiedFeature,
  UnifiedTrustResult
} from "@/lib/types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function addFeature(features: UnifiedFeature[], feature: UnifiedFeature) {
  if (!features.some((item) => item.id === feature.id)) {
    features.push(feature);
  }
}

function categoryFromScore(score: number): UnifiedTrustResult["category"] {
  if (score <= 30) return "SAFE";
  if (score <= 70) return "SUSPICIOUS";
  return "SPAM";
}

function colorFromCategory(category: UnifiedTrustResult["category"]): UnifiedTrustResult["color"] {
  if (category === "SAFE") return "green";
  if (category === "SUSPICIOUS") return "yellow";
  return "red";
}

function oneLineReason(category: UnifiedTrustResult["category"], unsafeReasons: string[]) {
  if (category === "SAFE") return "No suspicious patterns detected.";

  const text = unsafeReasons.join(" ").toLowerCase();
  if (/spoof|domain|url|shortened|https|link/.test(text) && /urgent|login|credential|verify/.test(text)) {
    return "Contains suspicious links and urgency-based language.";
  }
  if (/spoof|domain|url|shortened|https|link/.test(text)) {
    return "Contains suspicious link or domain signals.";
  }
  if (/urgent|login|credential|verify|scam/.test(text)) {
    return "Contains urgency-based language and credential-risk patterns.";
  }
  if (/harmful|nsfw|spam/.test(text)) {
    return "Contains sensitive or spam-like content patterns.";
  }
  return "Contains suspicious trust and safety signals.";
}

export function buildUnifiedTrustResult({
  phishing,
  aiDetection,
  mediaAnalysis,
  sensitiveContent,
  claimVerification,
  content,
  inputType,
  qrDecoded = false
}: {
  phishing?: PhishingAssessment | null;
  aiDetection?: AIDetectionSummary | null;
  mediaAnalysis?: MediaAnalysisSummary | null;
  sensitiveContent?: SensitiveContentSummary | null;
  claimVerification?: ClaimVerificationSummary | null;
  content?: string;
  inputType?: "url" | "text" | "image" | "video" | "qr";
  qrDecoded?: boolean;
}): UnifiedTrustResult {
  const features: UnifiedFeature[] = [];
  const safeReasons: string[] = [];
  const unsafeReasons: string[] = [];
  const text = content || "";

  if (qrDecoded) {
    addFeature(features, { id: "qr-decoded", label: "QR payload decoded successfully", weight: 0, source: "qr", polarity: "safe" });
    safeReasons.push("QR payload decoded successfully.");
  }

  if (
    phishing?.domain &&
    !claimVerification?.verificationRequired &&
    !phishing.reasons.some((reason) => /typosquatting|Missing HTTPS|shortener|Invalid URL|IP address/i.test(reason))
  ) {
    addFeature(features, { id: "secure-domain", label: "Secure domain", weight: -8, source: "url", polarity: "safe" });
    safeReasons.push("Secure domain.");
  }

  for (const reason of phishing?.reasons || []) {
    if (/typosquatting|IP address/i.test(reason)) {
      addFeature(features, { id: "domain-spoof", label: "Domain spoofing signal", weight: 30, source: "url", polarity: "unsafe" });
      unsafeReasons.push("Domain spoofing or IP-host signal detected.");
    } else if (/shortener|Missing HTTPS|Invalid URL|subdomains|punycode|random-looking URL/i.test(reason)) {
      addFeature(features, { id: "suspicious-link", label: "Suspicious link detected", weight: 25, source: "url", polarity: "unsafe" });
      unsafeReasons.push("Suspicious link detected.");
    } else if (/urgency|pressure|urgent/i.test(reason)) {
      addFeature(features, { id: "urgency-pattern", label: "Urgency pattern", weight: 15, source: "text", polarity: "unsafe" });
      unsafeReasons.push("Contains urgency language.");
    } else if (/credential|password|login/i.test(reason)) {
      addFeature(features, { id: "phishing-keyword", label: "Phishing keyword", weight: 20, source: "text", polarity: "unsafe" });
      unsafeReasons.push("Contains credential or login-risk wording.");
    }
  }

  if (/https?:\/\/|www\./i.test(text) && !phishing?.domain) {
    addFeature(features, { id: "raw-link", label: "Suspicious link in text", weight: 25, source: "text", polarity: "unsafe" });
    unsafeReasons.push("Contains a link inside the submitted text.");
  }

  if (/(urgent|verify now|login now|account blocked|payment failed|suspended)/i.test(text)) {
    addFeature(features, { id: "urgency-keywords", label: "Urgency keywords", weight: 15, source: "text", polarity: "unsafe" });
    unsafeReasons.push("Contains urgency-based language.");
  }

  if (/(\b\w+\b)(?:\s+\1){3,}/i.test(text)) {
    addFeature(features, { id: "repeated-phrases", label: "Repeated phrases", weight: 12, source: "text", polarity: "unsafe" });
    unsafeReasons.push("Repeated phrase pattern detected.");
  }

  if (sensitiveContent?.categories.includes("harmful")) {
    addFeature(features, { id: "harmful-content", label: "Harmful words", weight: 20, source: "sensitive", polarity: "unsafe" });
    unsafeReasons.push("Harmful language detected.");
  }
  if (sensitiveContent?.categories.includes("nsfw")) {
    addFeature(features, { id: "nsfw-content", label: "NSFW indicators", weight: 20, source: "sensitive", polarity: "unsafe" });
    unsafeReasons.push("NSFW indicators detected.");
  }
  if (sensitiveContent?.categories.includes("spam")) {
    addFeature(features, { id: "spam-content", label: "Spam pattern", weight: 20, source: "sensitive", polarity: "unsafe" });
    unsafeReasons.push("Spam-like pattern detected.");
  }
  if (sensitiveContent?.categories.includes("scam")) {
    addFeature(features, { id: "scam-content", label: "Scam keyword", weight: 20, source: "sensitive", polarity: "unsafe" });
    unsafeReasons.push("Scam-oriented language detected.");
  }

  if (mediaAnalysis?.image?.suspicious || mediaAnalysis?.video?.suspicious) {
    addFeature(features, { id: "media-suspicious", label: "Suspicious media signal", weight: 18, source: "media", polarity: "unsafe" });
    unsafeReasons.push("Suspicious image or video metadata detected.");
  }

  if (aiDetection?.text?.isLikelyAIGenerated || aiDetection?.image?.aiGeneratedImage) {
    addFeature(features, { id: "ai-generated", label: "AI-generated pattern", weight: 10, source: "ai", polarity: "unsafe" });
    unsafeReasons.push("AI-generated or templated content pattern detected.");
  }

  if ((phishing?.similarityScore || 0) >= 70) {
    addFeature(features, { id: "similarity-risk", label: "Known suspicious similarity", weight: 18, source: "similarity", polarity: "unsafe" });
    unsafeReasons.push("Similar to previously tracked suspicious content.");
  }

  if (claimVerification?.verificationRequired) {
    addFeature(features, { id: "verification-required", label: "High verification required", weight: 12, source: "text", polarity: "unsafe" });
    unsafeReasons.push("This claim requires external verification.");
  }

  if (claimVerification?.tags.includes("Viral Misinformation Pattern")) {
    addFeature(features, { id: "viral-misinfo", label: "Viral misinformation pattern", weight: 16, source: "text", polarity: "unsafe" });
    unsafeReasons.push("Contains viral or sensational misinformation framing.");
  }

  if (claimVerification?.noTrustedSource) {
    addFeature(features, { id: "no-trusted-source", label: "No trusted source", weight: 22, source: "text", polarity: "unsafe" });
    unsafeReasons.push("No credible source found.");
  }

  if (claimVerification?.credibleSourcePresent) {
    addFeature(features, { id: "credible-source", label: "Trusted source match", weight: -18, source: "text", polarity: "safe" });
    safeReasons.push("Trusted source coverage found.");
  }

  if (claimVerification?.factCheckHits.length) {
    addFeature(features, { id: "fact-check", label: "Fact-check reference", weight: -12, source: "text", polarity: "safe" });
    safeReasons.push("Fact-check coverage is available.");
  }

  const hasUrgency = features.some((feature) => feature.id === "urgency-pattern" || feature.id === "urgency-keywords");
  const hasCredentialOrScam = features.some((feature) => feature.id === "phishing-keyword" || feature.id === "scam-content");
  if (hasUrgency && hasCredentialOrScam) {
    addFeature(features, { id: "social-engineering-combo", label: "Social engineering pattern", weight: 22, source: "text", polarity: "unsafe" });
    unsafeReasons.push("Combines urgency with credential or scam language.");
  }

  if (!unsafeReasons.length) {
    safeReasons.push("No suspicious keywords.");
    safeReasons.push("No sensitive content categories detected.");
    if (inputType === "text") safeReasons.push("No harmful text patterns detected.");
  }

  const weightedScore = features.reduce((sum, feature) => sum + feature.weight, 0);
  const phishingScore = phishing?.phishingRiskScore || 0;
  const score = clamp(Math.round(Math.max(weightedScore, phishingScore * 0.9)));
  const category = categoryFromScore(score);

  return {
    score,
    category,
    color: colorFromCategory(category),
    reason: oneLineReason(category, unsafeReasons),
    safeScore: 100 - score,
    unsafeScore: score,
    safeReasons: unique(safeReasons).slice(0, 5),
    unsafeReasons: unique(unsafeReasons).slice(0, 6),
    features
  };
}
