import {
  AIDetectionSummary,
  AIGeneratedImageDetection,
  AIGeneratedTextDetection,
  MediaAnalysisResult,
  MediaAnalysisSummary,
  SensitiveContentCategory,
  SensitiveContentSummary
} from "@/lib/types";

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function urlTokens(value?: string) {
  if (!value) return [];
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreFromSignals(base: number, signals: string[], max = 100) {
  return clamp(base + signals.length * 12, 0, max);
}

export function analyzeImage(imageUrl?: string): MediaAnalysisResult | null {
  if (!imageUrl) return null;

  const tokens = urlTokens(imageUrl);
  const findings: string[] = [];

  if (tokens.some((token) => ["login", "signin", "verify", "bank", "secure", "wallet", "password"].includes(token))) {
    findings.push("Image URL suggests a login or account-verification interface.");
  }

  if (tokens.some((token) => ["paypal", "google", "microsoft", "apple", "amazon", "bank"].includes(token))) {
    findings.push("Image hints at branded UI that may be used for impersonation.");
  }

  if (imageUrl.startsWith("data:image/")) {
    findings.push("Inline image payload detected, which is common in screenshots and pasted social captures.");
  }

  if (/(screenshot|capture|mockup|auth|portal|otp)/i.test(imageUrl)) {
    findings.push("Image naming suggests a captured portal, login, or authentication surface.");
  }

  return {
    suspicious: findings.length >= 2,
    findings: findings.length ? findings : ["No strong suspicious media signals were detected in the image metadata."],
    sourceUrl: imageUrl
  };
}

export function analyzeVideo(videoUrl?: string): MediaAnalysisResult | null {
  if (!videoUrl) return null;

  const tokens = urlTokens(videoUrl);
  const findings: string[] = [];

  if (tokens.some((token) => ["login", "verify", "otp", "bank", "crypto", "wallet"].includes(token))) {
    findings.push("Video URL indicates a possible credential or financial flow.");
  }

  if (/(clip|screenrecord|capture|stream|reel)/i.test(videoUrl)) {
    findings.push("Video appears to be a recorded screen or social clip rather than a stable asset.");
  }

  return {
    suspicious: findings.length >= 2,
    findings: findings.length ? findings : ["No strong suspicious video signals were detected in the available metadata."],
    sourceUrl: videoUrl
  };
}

export function detectAIGeneratedText(text?: string): AIGeneratedTextDetection | null {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const sentences = normalized.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
  const averageLength = lengths.reduce((sum, value) => sum + value, 0) / Math.max(lengths.length, 1);
  const variation = lengths.length
    ? lengths.reduce((sum, value) => sum + Math.abs(value - averageLength), 0) / lengths.length
    : 0;
  const lower = normalized.toLowerCase();
  const signals: string[] = [];

  if (/it is important to note|in conclusion|furthermore|moreover|overall/i.test(normalized)) {
    signals.push("Uses generic transition phrases often seen in templated AI writing.");
  }

  if (variation < 3 && sentences.length >= 3) {
    signals.push("Sentence lengths are unusually uniform across the sample.");
  }

  if (/([a-z]{4,}\b)(?:.*\b\1\b){2,}/i.test(lower)) {
    signals.push("Repeated word patterns suggest templated generation.");
  }

  if (/(kindly|dear user|dear customer)/i.test(normalized) && /(verify|confirm|update|account)/i.test(normalized)) {
    signals.push("Formal repetitive phrasing overlaps with mass-generated scam messaging.");
  }

  const probability = clamp(Math.round(28 + signals.length * 18 + (variation < 3 ? 14 : 0)), 8, 96);

  return {
    aiGeneratedProbability: probability,
    isLikelyAIGenerated: probability >= 65,
    signals: signals.length ? signals : ["No strong heuristic signs of AI-generated text were detected."]
  };
}

export function detectAIGeneratedImage(imageUrl?: string): AIGeneratedImageDetection | null {
  if (!imageUrl) return null;

  const lower = imageUrl.toLowerCase();
  const signals: string[] = [];

  if (/(ai|generated|midjourney|dalle|diffusion|render|synthetic)/i.test(lower)) {
    signals.push("Image source metadata suggests an AI-generated or rendered asset.");
  }

  if (lower.startsWith("data:image/")) {
    signals.push("Inline image encoding can hide synthetic or edited assets in a single payload.");
  }

  if (/(smooth|upscaled|stylized|hd|4k)/i.test(lower)) {
    signals.push("Image naming leans toward polished synthetic or heavily edited output.");
  }

  const confidence = clamp(Math.round(18 + signals.length * 24), 6, 94);

  return {
    aiGeneratedImage: confidence >= 55,
    confidence,
    signals: signals.length ? signals : ["No strong heuristic signs of AI-generated imagery were detected."]
  };
}

export function detectSensitiveContent(content?: string): SensitiveContentSummary {
  const text = (content || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) {
    return {
      isSensitive: false,
      categories: [],
      severity: "low",
      signals: ["No textual content was available for sensitive-content review."]
    };
  }

  const categories: SensitiveContentCategory[] = [];
  const signals: string[] = [];
  const links = text.match(/https?:\/\/|www\./g)?.length || 0;

  if (/(urgent|verify now|login now|account blocked|payment failed|suspended|confirm now|password reset)/i.test(text)) {
    categories.push("scam");
    signals.push("Scam-oriented urgency or credential prompts were detected.");
  }

  if (/(attack|kill|threat|hurt|violence|weapon)/i.test(text)) {
    categories.push("harmful");
    signals.push("Potentially harmful or threatening language was detected.");
  }

  if (/(nsfw|nude|explicit|adult|sex|porn)/i.test(text)) {
    categories.push("nsfw");
    signals.push("Basic NSFW keyword patterns were detected.");
  }

  if (links >= 3 || /(\b\w+\b)(?:\s+\1){3,}/i.test(text) || /(free money|click here|limited offer)/i.test(text)) {
    categories.push("spam");
    signals.push("Spam-like repetition, multiple links, or mass-marketing language was detected.");
  }

  const uniqueCategories = unique(categories) as SensitiveContentCategory[];
  const severityScore = uniqueCategories.length * 22 + (links >= 3 ? 12 : 0) + (text.length > 350 ? 6 : 0);
  const severity = severityScore >= 55 ? "high" : severityScore >= 25 ? "medium" : "low";

  return {
    isSensitive: uniqueCategories.length > 0,
    categories: uniqueCategories,
    severity,
    signals: signals.length ? signals : ["No sensitive-content heuristics were triggered."]
  };
}

export function buildMediaAnalysis(imageUrl?: string, videoUrl?: string): MediaAnalysisSummary {
  return {
    image: analyzeImage(imageUrl),
    video: analyzeVideo(videoUrl)
  };
}

export function buildAIDetection(content?: string, imageUrl?: string): AIDetectionSummary {
  return {
    text: detectAIGeneratedText(content),
    image: detectAIGeneratedImage(imageUrl)
  };
}
