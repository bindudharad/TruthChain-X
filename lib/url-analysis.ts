import { PhishingAssessment, SimilarityMatch } from "@/lib/types";

export type UrlAnalysisResult = {
  domain: string;
  riskFlags: string[];
  riskScore: number;
  isSuspicious: boolean;
};

const suspiciousKeywords = ["login", "verify", "secure", "update", "bank", "account", "wallet", "payment", "reset", "signin"];
const shortenerHosts = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "rb.gy"];
const brandLookalikes: Array<{ canonical: string; patterns: RegExp[] }> = [
  { canonical: "amazon", patterns: [/amaz0n/i, /arnazon/i] },
  { canonical: "google", patterns: [/g00gle/i, /goog1e/i] },
  { canonical: "paypal", patterns: [/paypa1/i, /pay-pol/i] },
  { canonical: "microsoft", patterns: [/micr0soft/i, /rnicrosoft/i] },
  { canonical: "apple", patterns: [/app1e/i] }
];
const urgencyPatterns = [/account blocked/i, /account is blocked/i, /account has been blocked/i, /verify now/i, /urgent action required/i, /act now/i, /immediately/i];
const credentialPatterns = [/login to continue/i, /login now/i, /enter password/i, /verify your password/i, /confirm password/i, /sign in to continue/i, /credential/i];
const financialFearPatterns = [/payment failed/i, /billing issue/i, /invoice overdue/i, /bank alert/i, /wallet suspended/i];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function isIpHost(hostname: string) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function looksRandom(text: string) {
  return /[a-z0-9]{18,}/i.test(text.replace(/[-_/]/g, ""));
}

function normalizeDomain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function collectPhishingLanguageFlags(content: string) {
  const text = content || "";
  const flags: string[] = [];
  let score = 0;

  if (urgencyPatterns.some((pattern) => pattern.test(text))) {
    flags.push("Uses urgency language to pressure the user into acting quickly.");
    score += 32;
  }

  if (credentialPatterns.some((pattern) => pattern.test(text))) {
    flags.push("Requests login credentials or password confirmation.");
    score += 36;
  }

  if (financialFearPatterns.some((pattern) => pattern.test(text))) {
    flags.push("Uses payment or billing fear to drive a response.");
    score += 24;
  }

  if (/gift|reward|claim now|free/i.test(text)) {
    flags.push("Uses reward-style language commonly seen in scam funnels.");
    score += 18;
  }

  return {
    flags,
    score: clamp(score, 0, 100),
    hasUrgency: flags.some((flag) => /urgency/i.test(flag)),
    hasCredentialTrap: flags.some((flag) => /credential|password/i.test(flag)),
    hasFinancialFear: flags.some((flag) => /payment|billing/i.test(flag))
  };
}

export function analyzeUrl(url: string): UrlAnalysisResult {
  const riskFlags: string[] = [];
  let parsed: URL | null = null;

  try {
    parsed = new URL(url);
  } catch {
    return {
      domain: "",
      riskFlags: ["Invalid URL format"],
      riskScore: 72,
      isSuspicious: true
    };
  }

  const domain = parsed.hostname.toLowerCase();
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
  const full = `${domain}${pathAndQuery}`;

  if (parsed.protocol !== "https:") {
    riskFlags.push("Missing HTTPS");
  }

  if (isIpHost(domain)) {
    riskFlags.push("Uses IP address instead of domain");
  }

  if (shortenerHosts.includes(domain)) {
    riskFlags.push("Uses URL shortener");
  }

  if (domain.split(".").length > 4) {
    riskFlags.push("Excessive subdomains");
  }

  if (suspiciousKeywords.some((keyword) => full.includes(keyword))) {
    riskFlags.push("Contains phishing-style keywords");
  }

  if (url.length > 120 || looksRandom(pathAndQuery)) {
    riskFlags.push("Long or random-looking URL");
  }

  if (domain.includes("@")) {
    riskFlags.push("Contains @ symbol in domain");
  }

  if (domain.includes("xn--")) {
    riskFlags.push("Possible punycode obfuscation");
  }

  for (const brand of brandLookalikes) {
    if (brand.patterns.some((pattern) => pattern.test(domain))) {
      riskFlags.push(`Possible typosquatting of ${brand.canonical}`);
      break;
    }
  }

  const riskScore = clamp(
    riskFlags.reduce((score, flag) => {
      if (/IP address|typosquatting/i.test(flag)) return score + 30;
      if (/shortener/i.test(flag)) return score + 20;
      if (/Missing HTTPS|punycode/i.test(flag)) return score + 16;
      return score + 12;
    }, 6),
    0,
    100
  );

  return {
    domain: normalizeDomain(url),
    riskFlags,
    riskScore,
    isSuspicious: riskScore >= 35
  };
}

export function buildPhishingAssessment({
  url,
  content,
  truthScore,
  suspiciousSignals,
  similarityMatches = []
}: {
  url?: string;
  content: string;
  truthScore: number;
  suspiciousSignals: string[];
  similarityMatches?: SimilarityMatch[];
}): PhishingAssessment {
  const trimmedUrl = url?.trim();
  const urlAssessment = trimmedUrl ? analyzeUrl(trimmedUrl) : null;
  const language = collectPhishingLanguageFlags(content);
  const similarityScore = similarityMatches[0]?.similarityScore || 0;
  const truthPenalty = clamp(100 - truthScore, 0, 100);

  let phishingRiskScore =
    (trimmedUrl ? urlAssessment?.riskScore || 0 : 0) * 0.7 +
    language.score * 0.55 +
    truthPenalty * 0.3 +
    similarityScore * 0.2;

  if (language.hasCredentialTrap && language.hasUrgency) {
    phishingRiskScore += 12;
  }
  if (language.hasFinancialFear) {
    phishingRiskScore += 8;
  }
  if (urlAssessment?.riskFlags.some((flag) => /typosquatting|IP address/i.test(flag))) {
    phishingRiskScore += 12;
  }
  if (urlAssessment?.riskFlags.some((flag) => /Missing HTTPS|shortener|subdomains/i.test(flag))) {
    phishingRiskScore += 8;
  }
  if (similarityScore >= 70) {
    phishingRiskScore += 8;
  }
  if (!trimmedUrl && !language.flags.length && similarityScore < 60) {
    phishingRiskScore *= 0.45;
  }

  const riskScore = clamp(Math.round(phishingRiskScore), 0, 100);
  const reasons = unique([
    ...(urlAssessment ? urlAssessment.riskFlags.map((flag) => `URL signal: ${flag}.`) : []),
    ...language.flags,
    ...suspiciousSignals
      .filter((signal) => /impersonation|risk|viral|manipulation|synthetic|certainty|credential|phish/i.test(signal) && !/no major high-risk/i.test(signal))
      .map((signal) => `Model signal: ${signal}.`),
    ...(similarityScore >= 60 ? ["Current input overlaps with previously tracked phishing or scam patterns."] : []),
    ...(riskScore < 35 ? ["No strong phishing signals dominated this scan."] : [])
  ]);

  const attackType = urlAssessment?.riskFlags.some((flag) => /typosquatting|IP address|Missing HTTPS|shortener|subdomains/i.test(flag))
    ? "url-spoofing"
    : language.hasCredentialTrap
      ? "credential-trap"
      : language.hasUrgency || language.hasFinancialFear
        ? "social-engineering"
        : "suspicious-content";

  const riskLevel = riskScore >= 70 ? "dangerous" : riskScore >= 35 ? "suspicious" : "safe";

  return {
    analyzedUrl: trimmedUrl,
    domain: urlAssessment?.domain,
    phishingRiskScore: riskScore,
    riskLevel,
    attackType,
    reasons,
    similarityScore
  };
}
