import crypto from "node:crypto";
import tls from "node:tls";
import { Buffer } from "node:buffer";
import { AnalysisType, SignalType, SourcePlatform, Verdict } from "@prisma/client";
import {
  AnalysisInput,
  ClaimVerificationSummary,
  ContentType,
  CreatorProfile,
  DashboardAnalyzeResponse,
  FactCheckSummary,
  SimpleSpamOutput,
  SpamCategory,
  SpamColor,
  SpamFeatures,
  TrustSignal,
  TrustSimilarity,
  TrustSource,
  UnifiedTrustAnalysis,
  UnifiedTrustResult,
  VerificationRecord
} from "@/lib/types";
import { detectFeatures } from "@/lib/featureDetector";
import { verifyClaim } from "@/lib/factCheck";
import { generateDetailedExplanation } from "@/lib/reason";
import { runImageSearch } from "@/lib/image-search";
import { decodeQRCode } from "@/lib/qr-scanner";
import { searchReportSources, searchSimilaritySources } from "@/lib/searchService";
import { getPrisma, hasSqlDatabase } from "@/lib/prisma";
import { findVerificationByHash, saveVerification } from "@/lib/db";

type SafeBrowsingMatch = {
  threatType?: string;
  platformType?: string;
  threat?: { url?: string };
};

type SqlBundle = {
  id?: string;
  recordHash?: string;
  cached: boolean;
  createdAt?: string;
};

type EngineAnalysis = UnifiedTrustAnalysis & {
  explanation: string;
  details: string[];
  tags: string[];
  features: SpamFeatures;
  claimVerification: ClaimVerificationSummary;
  factCheck: FactCheckSummary;
  simpleOutput: SimpleSpamOutput;
  analyzedUrl?: string;
  creatorProfile: CreatorProfile;
  record: VerificationRecord;
  unified: UnifiedTrustResult;
};

const TRUSTED_DOMAINS = ["google.com", "github.com", "youtube.com", "amazon.com", "microsoft.com"];
const LOW_REPUTATION_TLDS = [".xyz", ".tk", ".top", ".click", ".buzz", ".monster", ".work", ".gq"];
const PHISHING_KEYWORDS = /\b(login|verify|password|otp|bank|account|secure|update billing|confirm identity)\b/i;
const VIRAL_KEYWORDS = /\b(breaking|shocking|share before deleted|viral|secretly|exposed)\b/i;
const PRIVATE_IP_PATTERN = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const ANALYSIS_CACHE_VERSION = "v4";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function buildAnalysisCacheKey(type: ContentType, value: string) {
  return sha256(`${ANALYSIS_CACHE_VERSION}:${type}:${value}`);
}

function normalizeCategory(category: SpamCategory): { verdict: UnifiedTrustAnalysis["verdict"]; riskLabel: "low" | "medium" | "high" } {
  if (category === "Safe") {
    return { verdict: "SAFE", riskLabel: "low" };
  }

  if (category === "Suspicious") {
    return { verdict: "SUSPICIOUS", riskLabel: "medium" };
  }

  return { verdict: "HIGH RISK", riskLabel: "high" };
}

function getTrustCategory(score: number): SpamCategory {
  if (score >= 71) return "Safe";
  if (score >= 31) return "Suspicious";
  return "Risk";
}

function getTrustColor(category: SpamCategory): SpamColor {
  if (category === "Safe") return "green";
  if (category === "Suspicious") return "yellow";
  return "red";
}

function getTrustReason(features: SpamFeatures, score: number, verification: ClaimVerificationSummary) {
  if (verification.claimStatus === "False") {
    return "Claim contradicted by live sources";
  }

  if (verification.claimStatus === "Unverified" && verification.claimDetected) {
    return "Claim needs real-world verification";
  }

  if (score >= 71) {
    return "No major risk signals detected";
  }

  if (features.hasSuspiciousLinks) {
    return "Contains suspicious external links";
  }

  if (features.hasPhishingKeywords || features.hasCredentialBait) {
    return "Contains phishing-related language";
  }

  if (features.hasUrgencyWords) {
    return "Uses urgency-based scam language";
  }

  if (features.hasViralMisinformationPattern) {
    return "Contains viral misinformation patterns";
  }

  return "Multiple suspicious patterns detected";
}

function buildCreatorProfile(input: AnalysisInput, score: number, verdict: UnifiedTrustAnalysis["verdict"], hash: string): CreatorProfile {
  const displayName = input.creatorName?.trim() || "Security Analyst";
  const creatorId = input.creatorId?.trim() || "truthchain-user";

  return {
    creatorId,
    displayName,
    credibilityScore: score,
    riskLevel: verdict === "HIGH RISK" ? "high" : verdict === "SUSPICIOUS" ? "medium" : "low",
    verifiedBadge: true,
    totalUploads: 1,
    verifiedCount: verdict === "SAFE" ? 1 : 0,
    flaggedCount: verdict === "SAFE" ? 0 : 1,
    contentHistory: [input.fileName || input.content.slice(0, 64) || input.url || "Latest analysis"],
    historySummary: "Latest analysis was generated from live trust signals and cached when possible.",
    blockchainIdentityId: hash.slice(0, 16).toUpperCase(),
    identityStatus: "queued"
  };
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrustedDomain(hostname: string) {
  return TRUSTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function normalizeUrlCandidate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function buildSourceName(link: string, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();
  const hostname = hostnameFromUrl(link);
  return hostname || "External source";
}

function isIpInput(value: string) {
  return IPV4_PATTERN.test(value.trim());
}

function isPrivateIp(value: string) {
  return PRIVATE_IP_PATTERN.test(value.trim());
}

function toWikipediaUrl(label: string) {
  const clean = label
    .replace(/^www\./i, "")
    .replace(/\.(com|org|net|io|dev|ai|co|gov|edu)$/i, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();

  if (!clean) return "";
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(clean.replace(/\s+/g, "_"))}`;
}

function buildOfficialSources(hostname: string, targetUrl: string, title?: string): TrustSource[] {
  if (!hostname) return [];

  const label = title?.trim() || hostname.replace(/^www\./, "");
  const wikipediaUrl = toWikipediaUrl(hostname);
  const sources: TrustSource[] = [
    {
      source: hostname,
      title: `${label} official site`,
      author: hostname,
      link: targetUrl,
      description: "Official source used as a fallback reference.",
      platform: "web"
    }
  ];

  if (wikipediaUrl) {
    sources.push({
      source: "Wikipedia",
      title: `${label} reference`,
      author: "Wikipedia",
      link: wikipediaUrl,
      description: "Public reference page used when live search results are sparse.",
      platform: "knowledge"
    });
  }

  if (isTrustedDomain(hostname)) {
    sources.push({
      source: hostname,
      title: `${label} support`,
      author: hostname,
      link: targetUrl,
      description: "Trusted domain support reference.",
      platform: "web"
    });
  }

  return sources;
}

function buildUrlVerificationQuery(hostname: string, metadataTitle: string) {
  const base = metadataTitle.trim() || hostname.replace(/\.(com|org|net|io|dev|ai|co)$/i, "");
  return `${base} official site verification`;
}

function mergeTrustSources(...sourceGroups: TrustSource[][]) {
  return sourceGroups
    .flat()
    .filter((source) => source.link && source.title)
    .filter(
      (source, index, all) =>
        all.findIndex(
          (candidate) => candidate.link === source.link || `${candidate.title}:${candidate.source}`.toLowerCase() === `${source.title}:${source.source}`.toLowerCase()
        ) === index
    );
}

function looksLikeDiscoveryTopic(text: string, features: SpamFeatures) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (!text.trim() || wordCount > 8) return false;
  if (features.hasPhishingKeywords || features.hasCredentialBait || features.hasUrgencyWords || features.hasSuspiciousLinks) return false;
  return /^[\w\s.+#-]{2,120}$/i.test(text.trim());
}

function sourcesToFactCheckArticles(sources: TrustSource[]): FactCheckSummary["articles"] {
  return sources.map((source) => ({
    title: source.title,
    description: source.description,
    url: source.link,
    source: source.source,
    sourceType: "serper" as const
  }));
}

function buildClaimVerification(text: string, factCheck: FactCheckSummary): ClaimVerificationSummary {
  const claimDetected =
    text.trim().split(/\s+/).length >= 4 &&
    /\b(announced|reported|claims?|says?|won|lost|married|died|election|policy|health|doctor|vaccine|cure|causes?|secretly|breaking)\b/i.test(text);
  const noTrustedSource = claimDetected && factCheck.sourcesFound === 0;
  const verified = claimDetected && factCheck.verified && !factCheck.contradictionFound;
  const claimStatus: ClaimVerificationSummary["claimStatus"] =
    !claimDetected ? "NotApplicable" : factCheck.contradictionFound ? "False" : verified ? "Verified" : "Unverified";

  const categories = [
    /\b(prime minister|president|minister|leader|celebrity|actor|singer)\b/i.test(text) ? "public-figure" : null,
    /\b(election|government|policy|parliament|minister)\b/i.test(text) ? "politics" : null,
    /\b(health|doctor|hospital|vaccine|medicine|cancer)\b/i.test(text) ? "health" : null,
    /\b(today|yesterday|breaking|announced|won|lost|earthquake|flood|married|died)\b/i.test(text) ? "major-event" : null
  ].filter(Boolean) as ClaimVerificationSummary["categories"];

  return {
    claims: claimDetected
      ? [
          {
            text,
            type: categories.includes("health") ? "health" : categories.includes("major-event") || categories.includes("politics") ? "news/event" : "general",
            categories,
            highVerificationRequired: categories.length > 0
          }
        ]
      : [],
    claimStatus,
    claimDetected,
    verificationRequired: claimDetected,
    categories,
    suspiciousClaimPatterns: VIRAL_KEYWORDS.test(text) ? ["viral-pattern"] : [],
    trustedContextDetected: factCheck.sourcesFound > 0,
    credibleSourcePresent: factCheck.sourcesFound > 0,
    noTrustedSource,
    verified,
    sourcesFound: factCheck.sourcesFound,
    trustedSourcesCount: factCheck.articles.filter((article) => /\.(gov|edu)\b/i.test(article.url) || /(bbc|reuters|apnews|wikipedia|thehindu)/i.test(article.source)).length,
    verificationScore: verified ? 85 : noTrustedSource ? 30 : factCheck.contradictionFound ? 15 : 45,
    verdict: verified ? "verified" : factCheck.contradictionFound ? "misleading" : claimDetected ? "unverified" : "not_applicable",
    confidence: clamp(factCheck.sourcesFound * 12 + (factCheck.verified ? 35 : 10)),
    checkedLive: factCheck.sourcesFound > 0,
    query: text,
    trustedSources: factCheck.articles.slice(0, 6).map((article) => ({
      title: article.title,
      source: article.source,
      url: article.url,
      snippet: article.description,
      publishedAt: article.publishedAt,
      sourceType: article.sourceType === "serper" ? "search" : "news"
    })),
    factCheckHits: factCheck.articles.slice(0, 6).map((article) => ({
      title: article.title,
      source: article.source,
      url: article.url,
      snippet: article.description,
      publishedAt: article.publishedAt,
      sourceType: article.sourceType === "serper" ? "search" : "news"
    })),
    tags: [
      ...(claimDetected ? ["Claim detected"] : []),
      ...(noTrustedSource ? ["No Trusted Sources Found"] : []),
      ...(factCheck.contradictionFound ? ["Claim Contradicted"] : []),
      ...(verified ? ["Verified by Live Sources"] : [])
    ],
    reason: !claimDetected
      ? "No claim detected"
      : factCheck.contradictionFound
        ? "Real-world sources contradict this claim"
        : verified
          ? "Trusted sources support this claim"
          : "This claim still needs verification",
    summary: factCheck.summary,
    explanation: factCheck.contradictionFound
      ? ["Multiple live sources suggest this claim is false or misleading."]
      : verified
        ? ["Live sources support the core claim in the submitted content."]
        : claimDetected
          ? ["The text appears to make a real-world claim, but source support is limited."]
          : ["No real-world claim required verification."]
  };
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function checkSafeBrowsing(targetUrl: string) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return { available: false, unsafe: false, matches: [] as SafeBrowsingMatch[] };
  }

  try {
    const payload = await fetchJson<{ matches?: SafeBrowsingMatch[] }>(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "truthchain-x",
            clientVersion: "1.0.0"
          },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: targetUrl }]
          }
        })
      }
    );

    return {
      available: true,
      unsafe: Boolean(payload.matches?.length),
      matches: payload.matches || []
    };
  } catch (error) {
    console.error("Safe Browsing lookup failed:", error);
    return { available: false, unsafe: false, matches: [] as SafeBrowsingMatch[] };
  }
}

async function lookupDomainAgeDays(hostname: string) {
  if (!hostname) {
    return { available: false, ageDays: null as number | null };
  }

  try {
    const payload = await fetchJson<{ events?: Array<{ eventAction?: string; eventDate?: string }> }>(`https://rdap.org/domain/${encodeURIComponent(hostname)}`);
    const registration = payload.events?.find((event) => /registration/i.test(event.eventAction || ""));
    if (!registration?.eventDate) {
      return { available: true, ageDays: null as number | null };
    }

    const ageDays = Math.floor((Date.now() - new Date(registration.eventDate).getTime()) / (1000 * 60 * 60 * 24));
    return { available: true, ageDays };
  } catch (error) {
    console.error("RDAP lookup failed:", error);
    return { available: false, ageDays: null as number | null };
  }
}

async function checkSslCertificate(targetUrl: string) {
  if (!/^https:\/\//i.test(targetUrl)) {
    return { available: true, valid: false };
  }

  const hostname = hostnameFromUrl(targetUrl);
  if (!hostname) {
    return { available: false, valid: false };
  }

  return new Promise<{ available: boolean; valid: boolean }>((resolve) => {
    const socket = tls.connect(
      443,
      hostname,
      {
        servername: hostname,
        rejectUnauthorized: true,
        timeout: 5000
      },
      () => {
        const peer = socket.getPeerCertificate();
        const valid = Boolean(peer && peer.subject);
        socket.end();
        resolve({ available: true, valid });
      }
    );

    socket.on("error", () => resolve({ available: true, valid: false }));
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ available: false, valid: false });
    });
  });
}

async function scrapePageMetadata(targetUrl: string) {
  try {
    const response = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "TruthChain-X/1.0 (+https://truthchain-x.local)"
      }
    });
    const finalUrl = response.url;
    const html = await response.text();
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
    const description =
      html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)?.[1]?.trim() ||
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i)?.[1]?.trim() ||
      "";
    return {
      available: true,
      title,
      description,
      finalUrl
    };
  } catch (error) {
    console.error("Metadata scrape failed:", error);
    return {
      available: false,
      title: "",
      description: "",
      finalUrl: targetUrl
    };
  }
}

async function countRedirects(targetUrl: string) {
  let currentUrl = targetUrl;
  let redirects = 0;

  try {
    for (let index = 0; index < 5; index += 1) {
      const response = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        cache: "no-store"
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) {
        break;
      }

      const location = response.headers.get("location");
      if (!location) {
        break;
      }

      redirects += 1;
      currentUrl = new URL(location, currentUrl).toString();
    }

    return { available: true, redirects };
  } catch (error) {
    console.error("Redirect check failed:", error);
    return { available: false, redirects: 0 };
  }
}

function buildFactCheckSummary(articles: Awaited<ReturnType<typeof verifyClaim>>["articles"]): FactCheckSummary {
  const contradictionKeywords = ["false", "fake", "rumor", "not true", "denied", "debunked", "misleading", "hoax"];
  const contradictionFound = articles.some((article) => {
    const content = `${article.title} ${article.description || ""}`.toLowerCase();
    return contradictionKeywords.some((keyword) => content.includes(keyword));
  });

  const verified = articles.length > 0 && !contradictionFound;

  return {
    sourcesFound: articles.length,
    verified,
    verdict: contradictionFound ? "FALSE" : verified ? "TRUE" : "UNVERIFIED",
    contradictionFound,
    summary: contradictionFound
      ? "Live sources contradict the submitted claim."
      : verified
        ? `Live sources were found for this input across ${articles.length} result${articles.length === 1 ? "" : "s"}.`
        : "No reliable live sources were found for this input.",
    articles
  };
}

function mapArticlesToSources(articles: FactCheckSummary["articles"]): TrustSource[] {
  return articles.slice(0, 8).map((article) => ({
    source: article.source,
    title: article.title,
    author: article.source,
    link: article.url,
    description: article.description,
    platform: article.sourceType
  }));
}

function buildUnified(score: number, reason: string, signals: TrustSignal[]): UnifiedTrustResult {
  const category = score >= 71 ? "SAFE" : score >= 31 ? "SUSPICIOUS" : "SPAM";
  const color = score >= 71 ? "green" : score >= 31 ? "yellow" : "red";
  const safeReasons = signals.filter((signal) => signal.type === "safe").map((signal) => signal.title);
  const unsafeReasons = signals.filter((signal) => signal.type === "risk").map((signal) => signal.title);

  return {
    score,
    category,
    color,
    reason,
    safeScore: score,
    unsafeScore: 100 - score,
    safeReasons,
    unsafeReasons,
    features: signals.map((signal, index) => ({
      id: `${signal.type}-${index}`,
      label: signal.title,
      weight: Math.abs(signal.impactScore),
      source: signal.type === "safe" ? "ai" : "url",
      polarity: signal.type === "safe" ? "safe" : "unsafe"
    }))
  };
}

function toSpamColor(color: string): SpamColor {
  return color === "green" || color === "yellow" ? color : "red";
}

function mapVerdictToAnalysisType(type: ContentType): AnalysisType {
  const map: Record<ContentType, AnalysisType> = {
    url: "url",
    text: "text",
    image: "image",
    video: "video",
    qr: "qr"
  };
  return map[type];
}

function mapVerdictToPrismaVerdict(verdict: UnifiedTrustAnalysis["verdict"]): Verdict {
  if (verdict === "SAFE") return "SAFE";
  if (verdict === "SUSPICIOUS") return "SUSPICIOUS";
  return "HIGH_RISK";
}

function mapSignalType(type: TrustSignal["type"]): SignalType {
  return type === "safe" ? "safe" : "risk";
}

function mapPlatform(platform?: string): SourcePlatform {
  if (!platform) return "web";
  if (/youtube/i.test(platform)) return "youtube";
  if (/(x|twitter|facebook|instagram|tiktok|telegram|social)/i.test(platform)) return "social";
  if (/image|lens|visual/i.test(platform)) return "image";
  if (/search/i.test(platform)) return "search";
  return "web";
}

function buildCompatibilityHash(inputHash: string) {
  return inputHash.slice(0, 32);
}

function sanitizeProviderError(message: string) {
  if (!message) return "A live provider was unavailable during this analysis.";
  if (/api key|unauthorized|forbidden/i.test(message)) {
    return "A live provider is unavailable or not configured for this analysis.";
  }

  return message;
}

async function loadCachedAnalysis(inputHash: string): Promise<EngineAnalysis | null> {
  if (!hasSqlDatabase()) {
    return null;
  }

  try {
    const prisma = getPrisma();
    const cached = await prisma.analysis.findUnique({
      where: { inputHash }
    });

    if (!cached?.responseJson) {
      return null;
    }

    return {
      ...(cached.responseJson as EngineAnalysis),
      analysisId: cached.id,
      cached: true,
      createdAt: cached.createdAt.toISOString()
    };
  } catch (error) {
    console.error("SQL cache lookup failed:", error);
    return null;
  }
}

async function storeAnalysisInSql(inputHash: string, type: ContentType, analysis: EngineAnalysis) {
  if (!hasSqlDatabase()) {
    return null;
  }

  try {
    const prisma = getPrisma();
    const stored = await prisma.analysis.upsert({
      where: { inputHash },
      update: {
        recordHash: analysis.record.hash,
        trustScore: analysis.score,
        safe: analysis.safe,
        risk: analysis.risk,
        verdict: mapVerdictToPrismaVerdict(analysis.verdict),
        explanation: analysis.explanation,
        reasons: analysis.reasons,
        confidence: analysis.confidence,
        limitedData: analysis.limitedData,
        cached: true,
        responseJson: analysis as unknown as object,
        reports: {
          deleteMany: {}
        },
        similarities: {
          deleteMany: {}
        },
        signals: {
          deleteMany: {}
        }
      },
      create: {
        input: analysis.input,
        inputHash,
        recordHash: analysis.record.hash,
        inputType: mapVerdictToAnalysisType(type),
        trustScore: analysis.score,
        safe: analysis.safe,
        risk: analysis.risk,
        verdict: mapVerdictToPrismaVerdict(analysis.verdict),
        explanation: analysis.explanation,
        reasons: analysis.reasons,
        confidence: analysis.confidence,
        limitedData: analysis.limitedData,
        cached: true,
        responseJson: analysis as unknown as object
      }
    });

    await prisma.signal.createMany({
      data: analysis.signals.map((signal) => ({
        analysisId: stored.id,
        type: mapSignalType(signal.type),
        title: signal.title,
        description: signal.description,
        impactScore: signal.impactScore
      }))
    });

    if (analysis.sources.length) {
      await prisma.report.createMany({
        data: analysis.sources.map((source) => ({
          analysisId: stored.id,
          sourceUrl: source.link,
          title: source.title,
          image: source.image,
          description: source.description,
          source: source.source,
          author: source.author,
          platform: mapPlatform(source.platform)
        }))
      });
    }

    if (analysis.similarities.length) {
      await prisma.similarity.createMany({
        data: analysis.similarities.map((item) => ({
          analysisId: stored.id,
          matchPercentage: item.matchPercentage,
          title: item.title,
          url: item.url,
          image: item.image,
          source: item.source
        }))
      });
    }

    return { id: stored.id, recordHash: stored.recordHash || undefined, cached: true, createdAt: stored.createdAt.toISOString() } satisfies SqlBundle;
  } catch (error) {
    console.error("SQL store failed:", error);
    return null;
  }
}

async function maybeDecodeQrFromImage(imageData: string) {
  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  try {
    const decoded = await decodeQRCode(Buffer.from(match[2], "base64"), match[1]);
    return decoded.rawData ? decoded : null;
  } catch (error) {
    console.error("QR decode attempt failed:", error);
    return null;
  }
}

async function analyzeUrl(targetUrl: string) {
  const normalizedUrl = normalizeUrlCandidate(targetUrl);
  const hostname = hostnameFromUrl(normalizedUrl);
  const trustedDomain = isTrustedDomain(hostname);
  const officialFallbackSources = buildOfficialSources(hostname, normalizedUrl);

  const [safeBrowsing, domainAge, sslStatus, metadata, redirects] = await Promise.all([
    checkSafeBrowsing(normalizedUrl),
    lookupDomainAgeDays(hostname),
    checkSslCertificate(normalizedUrl),
    scrapePageMetadata(normalizedUrl),
    countRedirects(normalizedUrl)
  ]);
  const factLookup = await verifyClaim(buildUrlVerificationQuery(hostname, metadata.title || ""))
    .then((result) => result.articles)
    .catch(() => []);
  const reportSources = await searchReportSources(metadata.title || hostname, { officialUrl: normalizedUrl });

  const pageText = `${normalizedUrl} ${metadata.title} ${metadata.description}`.trim();
  const features = { ...detectFeatures(pageText, null) };
  const factCheck = buildFactCheckSummary(factLookup);
  let risk = 0;
  const reasons: string[] = [];
  const signals: TrustSignal[] = [];
  let limitedData = false;

  if (trustedDomain) {
    signals.push({
      type: "safe",
      title: "Trusted domain allowlist",
      description: `${hostname} matches a known trusted domain.`,
      impactScore: 28
    });
  }

  if (!safeBrowsing.available) {
    limitedData = true;
    reasons.push("Google Safe Browsing data unavailable");
  } else if (safeBrowsing.unsafe) {
    risk += 50;
    reasons.push("Google Safe Browsing flagged this URL as unsafe");
    signals.push({
      type: "risk",
      title: "Safe Browsing flag",
      description: "Google Safe Browsing reported this URL as unsafe.",
      impactScore: -50
    });
  }

  if (!domainAge.available) {
    limitedData = true;
    reasons.push("Domain age lookup unavailable");
  } else if (typeof domainAge.ageDays === "number" && domainAge.ageDays < 30) {
    risk += 30;
    reasons.push("Domain was registered less than 30 days ago");
    signals.push({
      type: "risk",
      title: "Very new domain",
      description: "Recently registered domains are common in phishing campaigns.",
      impactScore: -30
    });
  } else if (typeof domainAge.ageDays === "number" && domainAge.ageDays > 365) {
    signals.push({
      type: "safe",
      title: "Established domain",
      description: "The domain has existed for more than a year.",
      impactScore: 10
    });
  }

  if (!sslStatus.available) {
    limitedData = true;
    reasons.push("SSL verification unavailable");
  } else if (!sslStatus.valid) {
    risk += 25;
    reasons.push("SSL certificate is invalid or missing");
    signals.push({
      type: "risk",
      title: "Invalid SSL",
      description: "The site does not present a valid HTTPS certificate.",
      impactScore: -25
    });
  } else {
    signals.push({
      type: "safe",
      title: "Valid HTTPS",
      description: "The site responded with a valid HTTPS certificate.",
      impactScore: 8
    });
  }

  if (!redirects.available) {
    limitedData = true;
  } else if (redirects.redirects > 2) {
    risk += 15;
    reasons.push("URL redirected multiple times");
    signals.push({
      type: "risk",
      title: "Multiple redirects",
      description: "Repeated redirects can hide the real destination of a malicious link.",
      impactScore: -15
    });
  }

  if (hostname.endsWith(".tk")) {
    risk += 45;
    reasons.push("Domain uses a high-risk .tk TLD");
    signals.push({
      type: "risk",
      title: "Suspicious TLD",
      description: "This .tk domain is commonly abused by low-trust campaigns.",
      impactScore: -45
    });
  } else if (hostname.endsWith(".xyz")) {
    risk += 30;
    reasons.push("Domain uses a high-risk TLD");
    signals.push({
      type: "risk",
      title: "Suspicious TLD",
      description: "This top-level domain is commonly abused by low-trust campaigns.",
      impactScore: -30
    });
  } else if (LOW_REPUTATION_TLDS.some((suffix) => hostname.endsWith(suffix))) {
    risk += 25;
    reasons.push("Domain uses a high-risk TLD");
  }

  const hasPhishingText = PHISHING_KEYWORDS.test(pageText) || features.hasPhishingKeywords;
  if (hasPhishingText) {
    risk += 20;
    reasons.push("Phishing-related language found in URL or metadata");
    signals.push({
      type: "risk",
      title: "Phishing keywords",
      description: "The URL or page metadata contains credential-bait language.",
      impactScore: -20
    });
  }

  if (factCheck.sourcesFound === 0 && !trustedDomain) {
    risk += 10;
    reasons.push("No strong public source footprint found");
  }

  features.hasSuspiciousLinks = safeBrowsing.unsafe || redirects.redirects > 2 || LOW_REPUTATION_TLDS.some((suffix) => hostname.endsWith(suffix)) || hasPhishingText;
  features.hasCredentialBait = hasPhishingText;
  features.hasPhishingKeywords = hasPhishingText;

  let score = clamp(100 - risk);
  if (trustedDomain && !safeBrowsing.unsafe && sslStatus.valid) {
    score = Math.max(score, 92);
  }

  const finalSources = mergeTrustSources(
    reportSources,
    factCheck.sourcesFound ? mapArticlesToSources(factCheck.articles) : [],
    officialFallbackSources
  );

  const finalFactCheck: FactCheckSummary = factCheck.sourcesFound || reportSources.length
    ? factCheck
    : {
        ...factCheck,
        sourcesFound: finalSources.length,
        articles: finalSources.map((source) => ({
          title: source.title,
          description: source.description,
          url: source.link,
          source: source.source,
          sourceType: "serper"
        })),
        summary: finalSources.length ? "Official fallback references were used because live search coverage was limited." : factCheck.summary
      };

  if (!factCheck.sourcesFound && reportSources.length) {
    finalFactCheck.sourcesFound = reportSources.length;
    finalFactCheck.verified = true;
    finalFactCheck.verdict = "TRUE";
    finalFactCheck.summary = `Live search returned ${reportSources.length} relevant source${reportSources.length === 1 ? "" : "s"} for this site.`;
    finalFactCheck.articles = sourcesToFactCheckArticles(reportSources);
  }

  return {
    input: normalizedUrl,
    type: "url" as const,
    score,
    reasons: reasons.length ? reasons : [trustedDomain ? "Trusted domain with no major risk signals found" : "No major URL risk signals found"],
    sources: finalSources,
    confidence: clamp(55 + (safeBrowsing.available ? 15 : 0) + (domainAge.available ? 10 : 0) + (sslStatus.available ? 10 : 0) + Math.min(factCheck.sourcesFound * 2, 10)),
    signals,
    features,
    claimVerification: buildClaimVerification(metadata.title || normalizedUrl, finalFactCheck),
    factCheck: finalFactCheck,
    limitedData,
    analyzedUrl: metadata.finalUrl || normalizedUrl,
    explanation: reasons[0] || "URL analysis completed using live security checks."
  };
}

async function analyzeText(text: string) {
  if (isIpInput(text)) {
    const privateIp = isPrivateIp(text);
    const score = privateIp ? 72 : 45;
    const reason = privateIp ? "Private IP analysis is limited but generally low risk" : "Public IP analysis is limited and needs deeper network intelligence";
    const factCheck: FactCheckSummary = {
      sourcesFound: 0,
      verified: false,
      verdict: "UNVERIFIED",
      contradictionFound: false,
      summary: "IP reputation checks are not fully configured in this build.",
      articles: []
    };

    return {
      input: text,
      type: "text" as const,
      score,
      reasons: [reason],
      sources: [],
      confidence: privateIp ? 45 : 40,
      signals: [
        {
          type: privateIp ? ("safe" as const) : ("risk" as const),
          title: privateIp ? "Private IP range" : "Public IP needs reputation lookup",
          description: privateIp
            ? "The IP belongs to a private network range and is usually not directly internet-routable."
            : "The IP is public, but full IP reputation intelligence is not configured yet.",
          impactScore: privateIp ? 10 : -20
        }
      ],
      features: detectFeatures(text, null),
      claimVerification: buildClaimVerification(text, factCheck),
      factCheck,
      limitedData: true,
      analyzedUrl: undefined,
      explanation: reason
    };
  }

  const features = detectFeatures(text, null);
  const factArticles = await verifyClaim(text)
    .then((result) => result.articles)
    .catch(() => []);
  let factCheck = buildFactCheckSummary(factArticles);
  let claimVerification = buildClaimVerification(text, factCheck);
  const reasons: string[] = [];
  const signals: TrustSignal[] = [];
  let sources: TrustSource[] = mapArticlesToSources(factCheck.articles);
  let similarities: TrustSimilarity[] = [];
  let risk = 0;

  if (features.hasSuspiciousLinks) {
    risk += 25;
    reasons.push("Suspicious links detected in the content");
    signals.push({ type: "risk", title: "Suspicious links", description: "The content contains links that may redirect to unsafe destinations.", impactScore: -25 });
  }
  if (features.hasPhishingKeywords || features.hasCredentialBait) {
    risk += 30;
    reasons.push("Credential-bait or phishing language detected");
    signals.push({ type: "risk", title: "Credential bait", description: "The text asks for sensitive verification details.", impactScore: -20 });
  }
  if (features.hasUrgencyWords) {
    risk += 25;
    reasons.push("Urgency language detected");
    signals.push({ type: "risk", title: "Urgency language", description: "Pressure tactics are common in scam content.", impactScore: -15 });
  }
  if (/\bclick\b/i.test(text)) {
    risk += 20;
    reasons.push("Click-through bait detected");
    signals.push({ type: "risk", title: "Click bait", description: "The text pushes the user to click immediately.", impactScore: -20 });
  }
  if (features.hasAllCaps || features.hasRepeatedText) {
    risk += 10;
    reasons.push("Shouting or repeated text patterns detected");
    signals.push({ type: "risk", title: "Aggressive formatting", description: "Repeated or all-caps text often signals spam-like behavior.", impactScore: -10 });
  }
  if (features.hasViralMisinformationPattern || features.hasSuspiciousClaimLanguage) {
    risk += 15;
    reasons.push("Viral misinformation patterns detected");
    signals.push({ type: "risk", title: "Viral claim pattern", description: "The wording resembles low-trust viral claims.", impactScore: -15 });
  }
  if (claimVerification.claimDetected && factCheck.sourcesFound === 0) {
    risk += 25;
    reasons.push("No trusted sources found for this claim");
    signals.push({ type: "risk", title: "No trusted sources", description: "The claim could not be supported by live source results.", impactScore: -25 });
  }
  if (factCheck.contradictionFound) {
    risk += 40;
    reasons.push("Claim contradicted by external sources");
    signals.push({ type: "risk", title: "Contradicted claim", description: "Live sources suggest the statement is false or misleading.", impactScore: -40 });
  }
  if (factCheck.verified && !factCheck.contradictionFound) {
    signals.push({ type: "safe", title: "Live source support", description: "External sources support the submitted claim.", impactScore: 18 });
  }
  if (!reasons.length) {
    reasons.push("No major risk patterns detected in the submitted content");
  }

  if (looksLikeDiscoveryTopic(text, features)) {
    const [reportSources, relatedTools] = await Promise.all([searchReportSources(text), searchSimilaritySources(text)]);
    if (reportSources.length) {
      sources = mergeTrustSources(reportSources, sources);
      factCheck = {
        sourcesFound: reportSources.length,
        verified: true,
        verdict: "TRUE",
        contradictionFound: false,
        summary: `Live search returned ${reportSources.length} relevant source${reportSources.length === 1 ? "" : "s"} for this topic.`,
        articles: sourcesToFactCheckArticles(reportSources)
      };
      claimVerification = buildClaimVerification(text, factCheck);
    }
    similarities = relatedTools;
  }

  const score = clamp(100 - risk);
  return {
    input: text,
    type: "text" as const,
    score,
    reasons,
    sources,
    confidence: clamp(45 + Math.min(factCheck.sourcesFound * 5, 30) + (factCheck.contradictionFound || factCheck.verified ? 15 : 0)),
    signals,
    features,
    claimVerification,
    factCheck,
    limitedData: factCheck.sourcesFound === 0 && claimVerification.claimDetected,
    analyzedUrl: undefined,
    explanation: getTrustReason(features, score, claimVerification),
    similarities
  };
}

async function analyzeVideo(videoUrl: string) {
  const normalizedUrl = normalizeUrlCandidate(videoUrl);
  let metadataTitle = "";
  let platform = hostnameFromUrl(normalizedUrl);

  try {
    if (/youtube\.com|youtu\.be/i.test(platform)) {
      const payload = await fetchJson<{ title?: string }>(`https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`);
      metadataTitle = payload.title || "";
      platform = "YouTube";
    } else if (/tiktok\.com/i.test(platform)) {
      const payload = await fetchJson<{ title?: string; author_name?: string }>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(normalizedUrl)}`);
      metadataTitle = payload.title || payload.author_name || "";
      platform = "TikTok";
    } else if (/instagram\.com/i.test(platform)) {
      platform = "Instagram";
    }
  } catch (error) {
    console.error("Video metadata lookup failed:", error);
  }

  const basis = metadataTitle || normalizedUrl;
  const searchBasis = metadataTitle ? `${metadataTitle} ${platform} official video` : normalizedUrl;
  const textAnalysis = await analyzeText(searchBasis);
  const reasons = [...textAnalysis.reasons];
  const signals: TrustSignal[] = [...textAnalysis.signals];
  let sources = [...textAnalysis.sources];
  let score = textAnalysis.score;

  if (/(must watch|you won't believe|shocking|secret|exposed)/i.test(basis)) {
    score = clamp(score - 15);
    reasons.unshift("Clickbait language detected in video metadata");
    signals.push({
      type: "risk",
      title: "Clickbait metadata",
      description: "The title or metadata uses exaggerated hooks common in low-trust video content.",
      impactScore: -15
    });
  }

  if (!sources.some((source) => source.link === normalizedUrl)) {
    sources.unshift({
      source: platform || "video",
      title: metadataTitle || "Original video",
      author: platform || "video",
      link: normalizedUrl,
      description: "Original submitted video URL.",
      platform: /youtube/i.test(platform) ? "youtube" : "web"
    });
  }

  const discoveryQuery = metadataTitle || basis;
  const [reportSources, relatedResults] = await Promise.all([searchReportSources(discoveryQuery, { officialUrl: normalizedUrl }), searchSimilaritySources(discoveryQuery, 5)]);
  sources = mergeTrustSources(sources, reportSources);

  const factCheck =
    textAnalysis.factCheck.sourcesFound > 0 || !sources.length
      ? textAnalysis.factCheck
      : {
          ...textAnalysis.factCheck,
          sourcesFound: sources.length,
          articles: sources.map((source) => ({
            title: source.title,
            description: source.description,
            url: source.link,
            source: source.source,
            sourceType: "serper" as const
          })),
          summary: sources.length
            ? "Video metadata was checked and source references were attached from the original platform."
            : textAnalysis.factCheck.summary
        };

  return {
    ...textAnalysis,
    input: normalizedUrl,
    type: "video" as const,
    score,
    reasons: Array.from(new Set(reasons)),
    signals,
    sources,
    factCheck,
    claimVerification: buildClaimVerification(`${metadataTitle || normalizedUrl}. ${platform}`, factCheck),
    analyzedUrl: normalizedUrl,
    explanation: metadataTitle ? `Video metadata from ${platform} was checked against live sources.` : "Video URL was checked against live sources and metadata patterns.",
    similarities: relatedResults.length ? relatedResults : textAnalysis.similarities
  };
}

async function analyzeImage(input: string) {
  let search: Awaited<ReturnType<typeof runImageSearch>> | null = null;
  let limitedReason = "";

  try {
    search = await runImageSearch(input.startsWith("http") ? { imageUrl: input } : { imageData: input });
  } catch (error) {
    limitedReason = sanitizeProviderError(error instanceof Error ? error.message : "Reverse image search is unavailable.");
  }

  if (!search) {
    return {
      input,
      type: "image" as const,
      score: 55,
      reasons: ["Limited data available for reverse image search"],
      sources: [],
      confidence: 35,
      signals: [
        {
          type: "risk" as const,
          title: "Image search unavailable",
          description: limitedReason || "The reverse image provider could not be reached or is not configured.",
          impactScore: -10
        }
      ],
      features: detectFeatures("image analysis", null),
      claimVerification: buildClaimVerification("image analysis", {
        sourcesFound: 0,
        verified: false,
        verdict: "UNVERIFIED" as const,
        contradictionFound: false,
        summary: limitedReason || "Reverse image search unavailable.",
        articles: []
      }),
      factCheck: {
        sourcesFound: 0,
        verified: false,
        verdict: "UNVERIFIED" as const,
        contradictionFound: false,
        summary: limitedReason || "Reverse image search unavailable.",
        articles: []
      },
      limitedData: true,
      analyzedUrl: input.startsWith("http") ? input : undefined,
      explanation: "Reverse image search is unavailable, so only limited analysis could be completed.",
      similarities: []
    };
  }

  const sources: TrustSource[] = search.results.map((item) => ({
    image: item.thumbnail,
    source: item.source,
    title: item.title,
    author: item.source,
    link: item.link,
    description: item.aiSummary,
    platform: "image-search"
  }));
  const similarities: TrustSimilarity[] = search.results.map((item) => ({
    title: item.title,
    url: item.link,
    image: item.thumbnail,
    matchPercentage: item.trustScore,
    source: item.source
  }));

  let risk = 0;
  const reasons: string[] = [];
  const signals: TrustSignal[] = [];
  const suspiciousMatches = search.results.filter((item) => item.suspicious);
  const trustedMatches = search.results.filter((item) => item.trustScore >= 75);

  if (!search.results.length) {
    risk += 25;
    reasons.push("No strong reverse image matches were found");
  }
  if (suspiciousMatches.length) {
    risk += Math.min(40, suspiciousMatches.length * 8);
    reasons.push("Several visual matches come from low-trust sources");
    signals.push({
      type: "risk",
      title: "Low-trust visual matches",
      description: "Related image results appeared on low-trust or suspicious sites.",
      impactScore: -Math.min(40, suspiciousMatches.length * 8)
    });
  }
  if (trustedMatches.length) {
    signals.push({
      type: "safe",
      title: "Credible visual matches",
      description: "Related image results were found on more credible domains.",
      impactScore: Math.min(20, trustedMatches.length * 4)
    });
  }

  const averageMatchScore = search.results.length
    ? Math.round(search.results.reduce((sum, item) => sum + item.trustScore, 0) / search.results.length)
    : 50;
  const score = clamp(Math.round((100 - risk + averageMatchScore) / 2));
  const explanation = reasons[0] || "Reverse image search found matches with no major risk indicators.";
  const factCheck: FactCheckSummary = {
    sourcesFound: search.results.length,
    verified: trustedMatches.length > 0 && suspiciousMatches.length === 0,
    verdict: trustedMatches.length > 0 && suspiciousMatches.length === 0 ? "TRUE" : search.results.length ? "UNVERIFIED" : "UNVERIFIED",
    contradictionFound: false,
    summary: search.note || "Reverse image search completed.",
    articles: search.results.map((item) => ({
      title: item.title,
      description: item.aiSummary,
      url: item.link,
      source: item.source,
      sourceType: "serper"
    }))
  };

  return {
    input: search.imageUrl,
    type: "image" as const,
    score,
    reasons: reasons.length ? reasons : ["Image matches mostly point to established public sources"],
    sources,
    confidence: clamp(55 + Math.min(search.results.length * 4, 25)),
    signals,
    features: detectFeatures(search.results.map((item) => `${item.title} ${item.source}`).join(" "), null),
    claimVerification: buildClaimVerification(search.results.map((item) => item.title).join(". "), factCheck),
    factCheck,
    limitedData: !search.results.length,
    analyzedUrl: search.imageUrl,
    explanation,
    similarities
  };
}

function buildVerificationRecord(
  analysis: UnifiedTrustAnalysis,
  input: AnalysisInput,
  creatorProfile: CreatorProfile,
  unified: UnifiedTrustResult,
  claimVerification: ClaimVerificationSummary,
  factCheck: FactCheckSummary,
  features: SpamFeatures,
  explanation: string
): VerificationRecord {
  const now = new Date().toISOString();
  const recordHash = buildCompatibilityHash(buildAnalysisCacheKey(analysis.type, analysis.input));
  const preview = analysis.input.length > 240 ? `${analysis.input.slice(0, 237)}...` : analysis.input;

  return {
    id: recordHash,
    hash: recordHash,
    type: analysis.type,
    fileName: input.fileName || `${analysis.type}-analysis`,
    url: analysis.type === "url" || analysis.type === "video" ? analysis.input : undefined,
    creatorId: creatorProfile.creatorId,
    creatorProfile,
    embedding: [],
    truthScore: analysis.score,
    confidence: analysis.confidence,
    executiveSummary: explanation,
    explanation,
    findings: analysis.reasons,
    suspiciousSignals: analysis.signals.filter((signal) => signal.type === "risk").map((signal) => signal.title),
    detectedClaims: claimVerification.claims?.map((claim) => claim.text) || [],
    modelBreakdown: [],
    preprocessing: {
      contentHash: sha256(analysis.input),
      mimeType: input.mimeType || "text/plain",
      byteLength: Buffer.byteLength(analysis.input),
      metadata: analysis.sources.slice(0, 3).map((source) => source.source),
      sampledFrames: analysis.type === "video" ? 1 : 0
    },
    consensus: {
      label: analysis.verdict,
      meter: analysis.safe,
      weightedTruthScore: analysis.score,
      confidence: analysis.confidence,
      basedOn: analysis.reasons
    },
    trustFingerprint: {
      truthScore: analysis.score,
      manipulationRisk: analysis.verdict === "HIGH RISK" ? "high" : analysis.verdict === "SUSPICIOUS" ? "medium" : "low",
      sourceCredibility: analysis.sources.length > 0 ? "high" : "medium",
      aiConsensus: analysis.confidence,
      similarMatches: analysis.similarities.length,
      confidence: analysis.confidence,
      fingerprintId: recordHash
    },
    trustGraph: analysis.similarities.slice(0, 6).map((item) => ({
      hash: sha256(`${item.title}:${item.url || ""}`).slice(0, 32),
      label: item.title,
      similarity: item.matchPercentage,
      truthScore: analysis.score,
      relationship: item.source || "Related source"
    })),
    viralSignal: {
      repeatCount: features.hasRepeatedText ? 2 : 0,
      trendingScore: analysis.risk,
      status: analysis.risk >= 70 ? "viral" : analysis.risk >= 40 ? "watch" : "emerging",
      clusterLabel: analysis.verdict
    },
    comparisonVisuals: analysis.similarities.slice(0, 6).map((item) => ({
      title: item.title,
      description: item.description || item.source || "Related result discovered by the similarity engine.",
      prompt: item.url || item.source || item.title
    })),
    openSourceSignals: analysis.sources.slice(0, 5).map((source, index) => ({
      id: `${recordHash}-source-${index}`,
      kind: "news",
      title: source.title,
      summary: source.description || source.source,
      score: analysis.score,
      confidence: analysis.confidence,
      stance: factCheck.contradictionFound ? "challenges" : factCheck.verified ? "supports" : "mixed",
      source: source.source,
      url: source.link
    })),
    explainability: analysis.signals.map((signal) => ({
      label: signal.type === "safe" ? "Source Credibility" : "AI Analysis",
      value: Math.abs(signal.impactScore),
      weight: Math.abs(signal.impactScore),
      impact: signal.type === "safe" ? "positive" : "negative",
      detail: signal.description
    })),
    factTimeline: [
      {
        stage: "origin",
        title: "Input received",
        detail: "TruthChain-X accepted the submitted content for analysis.",
        timestamp: now,
        status: "complete"
      },
      {
        stage: "verified",
        title: "Trust analysis completed",
        detail: explanation,
        timestamp: now,
        status: analysis.verdict === "SAFE" ? "complete" : "watch"
      }
    ],
    phishingAssessment: {
      analyzedUrl: analysis.type === "url" || analysis.type === "video" ? analysis.input : undefined,
      domain: analysis.type === "url" || analysis.type === "video" ? hostnameFromUrl(analysis.input) : undefined,
      phishingRiskScore: analysis.risk,
      riskLevel: analysis.risk >= 70 ? "dangerous" : analysis.risk >= 35 ? "suspicious" : "safe",
      attackType:
        features.hasSuspiciousLinks && features.hasCredentialBait
          ? "credential-trap"
          : features.hasSuspiciousLinks
            ? "url-spoofing"
            : features.hasUrgencyWords || features.hasPhishingKeywords
              ? "social-engineering"
              : "suspicious-content",
      reasons: analysis.reasons,
      similarityScore: analysis.similarities[0]?.matchPercentage || 0
    },
    mediaAnalysis: {
      image: analysis.type === "image" ? { suspicious: analysis.risk > 50, findings: analysis.reasons, sourceUrl: analysis.sources[0]?.link } : null,
      video: analysis.type === "video" ? { suspicious: analysis.risk > 50, findings: analysis.reasons, sourceUrl: analysis.input } : null
    },
    aiDetection: {
      text: analysis.type === "text" || analysis.type === "url" || analysis.type === "video"
        ? {
            aiGeneratedProbability: analysis.risk,
            isLikelyAIGenerated: false,
            signals: analysis.signals.map((signal) => signal.title)
          }
        : null,
      image: analysis.type === "image"
        ? {
            aiGeneratedImage: false,
            confidence: analysis.confidence,
            signals: analysis.signals.map((signal) => signal.title)
          }
        : null
    },
    sensitiveContent: {
      isSensitive: analysis.risk > 75,
      categories: analysis.risk > 75 ? ["scam"] : [],
      severity: analysis.risk > 75 ? "high" : analysis.risk > 45 ? "medium" : "low",
      signals: analysis.reasons
    },
    claimVerification,
    unified,
    timestamp: now,
    firstVerifiedAt: now,
    lastVerifiedAt: now,
    occurrenceCount: 1,
    previouslyVerified: false,
    blockchainStatus: "queued",
    transactionHash: "",
    sourcePreview: preview
  };
}

function buildDashboardResponse(analysis: EngineAnalysis): DashboardAnalyzeResponse {
  const category = getTrustCategory(analysis.score);
  const color = getTrustColor(category);
  const { riskLabel } = normalizeCategory(category);

  return {
    score: analysis.score,
    category,
    color,
    reason: analysis.simpleOutput.reason,
    features: analysis.features,
    claims: analysis.claimVerification.claims,
    claimStatus: analysis.claimVerification.claimStatus,
    verification: {
      verified: analysis.claimVerification.verified,
      confidence: analysis.claimVerification.confidence,
      sourcesFound: analysis.claimVerification.sourcesFound,
      trustedSources: analysis.claimVerification.trustedSourcesCount,
      verdict:
        analysis.claimVerification.claimStatus === "Verified"
          ? "TRUE"
          : analysis.claimVerification.claimStatus === "False"
            ? "MISLEADING"
            : "UNVERIFIED",
      summary: analysis.claimVerification.summary
    },
    simpleOutput: analysis.simpleOutput,
    details: analysis.details,
    tags: analysis.tags,
    trustScore: analysis.score,
    risk: riskLabel,
    credibility: analysis.confidence >= 75 ? "high" : analysis.confidence >= 50 ? "medium" : "low",
    consensus: analysis.safe,
    matches: analysis.similarities.length,
    confidence: analysis.confidence,
    explanation: analysis.explanation,
    sources: {
      groq: 0,
      hf: 0,
      gpt: 0,
      gemma: 0
    },
    txHash: analysis.record.transactionHash,
    blockchainStatus: analysis.record.blockchainStatus,
    creator: analysis.creatorProfile,
    record: analysis.record,
    phishingRiskScore: analysis.risk,
    riskLevel: analysis.risk >= 70 ? "dangerous" : analysis.risk >= 35 ? "suspicious" : "safe",
    attackType: analysis.features.hasSuspiciousLinks ? "url-spoofing" : analysis.features.hasPhishingKeywords ? "credential-trap" : "suspicious-content",
    reasons: analysis.reasons,
    analyzedUrl: analysis.analyzedUrl,
    similarityScore: analysis.similarities[0]?.matchPercentage || 0,
    similarMatches: analysis.similarities.map((item, index) => ({
      matchId: `${analysis.record.hash}-similar-${index}`,
      similarityScore: item.matchPercentage,
      matchedContent: item.title,
      preview: item.title,
      source: "TruthChain",
      url: item.url || "",
      caption: item.description || item.source || "Related source",
      trustScore: item.matchPercentage,
      platforms: ["TruthChain"],
      reportCount: 0,
      severity: item.matchPercentage >= 75 ? "high" : item.matchPercentage >= 45 ? "medium" : "low",
      image: item.image || ""
    })),
    aiDetection: analysis.record.aiDetection,
    mediaAnalysis: analysis.record.mediaAnalysis,
    sensitiveContent: analysis.record.sensitiveContent,
    unified: analysis.unified,
    claimVerification: analysis.claimVerification,
    factCheck: analysis.factCheck
  };
}

function buildDashboardResponseFromRecord(record: VerificationRecord): DashboardAnalyzeResponse {
  const score = record.truthScore;
  const category = getTrustCategory(score);
  const color = getTrustColor(category);
  const features = detectFeatures(`${record.url || ""} ${record.sourcePreview || ""}`.trim(), record.claimVerification);
  const reason = record.explanation || getTrustReason(features, score, record.claimVerification);
  const details = Array.from(new Set([...(record.findings || []), ...(record.suspiciousSignals || [])]));
  const tags = Array.from(
    new Set([
      ...(features.hasSuspiciousLinks ? ["Suspicious Links"] : []),
      ...(features.hasPhishingKeywords ? ["Phishing Keywords"] : []),
      ...(features.hasCredentialBait ? ["Credential Bait"] : []),
      ...(record.claimVerification?.tags || [])
    ])
  );

  return {
    score,
    category,
    color,
    reason,
    features,
    claims: record.claimVerification.claims,
    claimStatus: record.claimVerification.claimStatus,
    verification: {
      verified: record.claimVerification.verified,
      confidence: record.claimVerification.confidence,
      sourcesFound: record.claimVerification.sourcesFound,
      trustedSources: record.claimVerification.trustedSourcesCount,
      verdict:
        record.claimVerification.claimStatus === "Verified"
          ? "TRUE"
          : record.claimVerification.claimStatus === "False"
            ? "MISLEADING"
            : "UNVERIFIED",
      summary: record.claimVerification.summary
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
    details,
    tags,
    trustScore: score,
    risk: normalizeCategory(category).riskLabel,
    credibility: score >= 80 ? "high" : score >= 50 ? "medium" : "low",
    consensus: score,
    matches: record.trustGraph.length,
    confidence: record.confidence,
    explanation: reason,
    sources: { groq: 0, hf: 0, gpt: 0, gemma: 0 },
    txHash: record.transactionHash,
    blockchainStatus: record.blockchainStatus,
    creator: record.creatorProfile,
    record,
    phishingRiskScore: 100 - score,
    riskLevel: score <= 30 ? "dangerous" : score <= 70 ? "suspicious" : "safe",
    attackType: record.phishingAssessment?.attackType || "suspicious-content",
    reasons: details,
    analyzedUrl: record.url,
    similarityScore: record.trustGraph[0]?.similarity || 0,
    similarMatches: record.trustGraph.map((item, index) => ({
      matchId: `${record.hash}-cached-${index}`,
      similarityScore: item.similarity,
      matchedContent: item.label,
      preview: item.label,
      source: "TruthChain",
      url: "",
      caption: item.relationship,
      trustScore: item.truthScore,
      platforms: ["TruthChain"],
      reportCount: 0,
      severity: item.similarity >= 75 ? "high" : item.similarity >= 45 ? "medium" : "low"
    })),
    aiDetection: record.aiDetection,
    mediaAnalysis: record.mediaAnalysis,
    sensitiveContent: record.sensitiveContent,
    unified: record.unified,
    claimVerification: record.claimVerification,
    factCheck: {
      sourcesFound: record.claimVerification.sourcesFound,
      verified: record.claimVerification.verified,
      verdict:
        record.claimVerification.claimStatus === "Verified"
          ? "TRUE"
          : record.claimVerification.claimStatus === "False"
            ? "FALSE"
            : "UNVERIFIED",
      contradictionFound: record.claimVerification.claimStatus === "False",
      summary: record.claimVerification.summary,
      articles: (record.openSourceSignals || []).map((signal) => ({
        title: signal.title,
        description: signal.summary,
        url: signal.url,
        source: signal.source,
        sourceType: "serper" as const
      }))
    }
  };
}

export async function analyzeInput(input: AnalysisInput): Promise<DashboardAnalyzeResponse> {
  const contentType = input.type;
  const primaryInput = (input.url || input.videoUrl || input.imageUrl || input.content || "").trim();

  if (!primaryInput) {
    throw new Error("No analyzable content was provided.");
  }

  const inputHash = buildAnalysisCacheKey(contentType, primaryInput);
  const compatibilityHash = buildCompatibilityHash(inputHash);

  const cachedRecord = await findVerificationByHash(compatibilityHash).catch(() => null);
  if (cachedRecord) {
    return buildDashboardResponseFromRecord(cachedRecord);
  }

  const cached = await loadCachedAnalysis(inputHash);
  if (cached) {
    return buildDashboardResponse({
      ...cached,
      cached: true
    });
  }

  let base:
    | Awaited<ReturnType<typeof analyzeUrl>>
    | Awaited<ReturnType<typeof analyzeText>>
    | Awaited<ReturnType<typeof analyzeVideo>>
    | Awaited<ReturnType<typeof analyzeImage>>;
  let contentTypeForRecord: ContentType = contentType;

  if (contentType === "image" && primaryInput.startsWith("data:image")) {
    const qrPayload = await maybeDecodeQrFromImage(primaryInput);
    if (qrPayload?.rawData) {
      contentTypeForRecord = "qr";
      base = qrPayload.type === "url" ? await analyzeUrl(qrPayload.rawData) : await analyzeText(qrPayload.rawData);
    } else {
      base = await analyzeImage(primaryInput);
    }
  } else if (contentType === "url") {
    base = await analyzeUrl(primaryInput);
  } else if (contentType === "video") {
    base = await analyzeVideo(primaryInput);
  } else if (contentType === "text") {
    const maybeUrl = normalizeUrlCandidate(primaryInput);
    base = /^https?:\/\//i.test(maybeUrl) ? await analyzeUrl(maybeUrl) : await analyzeText(primaryInput);
    if (base.type === "url") {
      contentTypeForRecord = "url";
    }
  } else if (contentType === "qr") {
    base = /^https?:\/\//i.test(normalizeUrlCandidate(primaryInput)) ? await analyzeUrl(primaryInput) : await analyzeText(primaryInput);
  } else {
    base = await analyzeImage(primaryInput);
  }

  const score = clamp(base.score);
  const safe = score;
  const risk = 100 - score;
  const category = getTrustCategory(score);
  const color = getTrustColor(category);
  const verdict = normalizeCategory(category).verdict;
  const reason = getTrustReason(base.features, score, base.claimVerification);
  const details = Array.from(new Set([...generateDetailedExplanation(base.features, base.claimVerification), ...base.reasons]));
  const tags = Array.from(
    new Set([
      ...(base.features.hasSuspiciousLinks ? ["Suspicious Links"] : []),
      ...(base.features.hasPhishingKeywords ? ["Phishing Keywords"] : []),
      ...(base.features.hasCredentialBait ? ["Credential Bait"] : []),
      ...(base.claimVerification.claimDetected ? ["Claim detected"] : []),
      ...(base.claimVerification.noTrustedSource ? ["No Trusted Sources Found"] : []),
      ...(base.factCheck.contradictionFound ? ["Claim Contradicted"] : []),
      ...(base.factCheck.verified ? ["Verified by Live Sources"] : []),
      ...(base.type === "image" ? ["Reverse image search"] : []),
      ...(contentTypeForRecord === "qr" ? ["QR decoded"] : [])
    ])
  );
  const signals = Array.from(
    new Map(
      base.signals.map((signal) => [
        `${signal.type}:${signal.title}`,
        signal
      ])
    ).values()
  );
  const unified = buildUnified(score, reason, signals);
  const creatorProfile = buildCreatorProfile(input, score, verdict, inputHash);
  const similarities: TrustSimilarity[] =
    "similarities" in base && Array.isArray(base.similarities)
      ? base.similarities
      : base.sources.map((source) => ({
          title: source.title,
          url: source.link,
          image: source.image,
          matchPercentage: clamp(score),
          source: source.source
        }));

  const record = buildVerificationRecord(
    {
      input: base.input,
      type: contentTypeForRecord,
      score,
      safe,
      risk,
      verdict,
      reasons: base.reasons,
      sources: base.sources,
      confidence: base.confidence,
      signals,
      similarities,
      limitedData: base.limitedData,
      cached: false
    },
    input,
    creatorProfile,
    unified,
    base.claimVerification,
    base.factCheck,
    base.features,
    reason
  );

  const persistedRecord = await saveVerification(record).catch((error) => {
    console.error("Legacy verification save failed:", error);
    return record;
  });

  const analysis: EngineAnalysis = {
    analysisId: undefined,
    input: base.input,
    type: contentTypeForRecord,
    score,
    safe,
    risk,
    verdict,
    reasons: base.reasons,
    sources: base.sources,
    confidence: base.confidence,
    signals,
    similarities,
    limitedData: base.limitedData,
    cached: false,
    explanation: reason,
    details,
    tags,
    features: base.features,
    claimVerification: base.claimVerification,
    factCheck: base.factCheck,
    simpleOutput: {
      score,
      category,
      color,
      reason,
      features: base.features,
      tags,
      details
    },
    analyzedUrl: base.analyzedUrl,
    creatorProfile,
    record: persistedRecord,
    unified
  };

  const sqlBundle = await storeAnalysisInSql(inputHash, contentTypeForRecord, analysis);
  if (sqlBundle?.id) {
    analysis.analysisId = sqlBundle.id;
    analysis.createdAt = sqlBundle.createdAt;
  }

  return buildDashboardResponse(analysis);
}

export async function getCachedAnalysis(input: AnalysisInput): Promise<DashboardAnalyzeResponse | null> {
  const contentType = input.type;
  const primaryInput = (input.url || input.videoUrl || input.imageUrl || input.content || "").trim();

  if (!primaryInput) {
    return null;
  }

  const inputHash = buildAnalysisCacheKey(contentType, primaryInput);
  const compatibilityHash = buildCompatibilityHash(inputHash);

  const cachedRecord = await findVerificationByHash(compatibilityHash).catch(() => null);
  if (cachedRecord) {
    return buildDashboardResponseFromRecord(cachedRecord);
  }

  const cached = await loadCachedAnalysis(inputHash);
  if (cached) {
    return buildDashboardResponse({
      ...cached,
      cached: true
    });
  }

  return null;
}
