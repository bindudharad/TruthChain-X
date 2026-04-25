import { detectFeatures } from "@/lib/featureDetector";
import { verifyClaim } from "@/lib/factCheck";
import { getCategory } from "@/lib/category";
import { generateReason } from "@/lib/reason";
import { analyzeUrl } from "@/lib/url-analysis";
import { calculateScore } from "@/lib/scoringEngine";
import { SpamCategory, UniversalAnalysisResponse, UniversalContentMode, UniversalSourceCard } from "@/lib/types";

function toRiskLevel(category: SpamCategory): "Low" | "Medium" | "High" {
  if (category === "Safe") return "Low";
  if (category === "Suspicious") return "Medium";
  return "High";
}

function scoreSource(source: string, title: string, link: string) {
  const haystack = `${source} ${title} ${link}`.toLowerCase();
  let trustScore = 68;

  if (/(reuters|bbc|ap news|apnews|thehindu|wikipedia|\.gov|\.edu|youtube|github)/i.test(haystack)) trustScore += 20;
  if (/\.(xyz|top|click|buzz|monster|work|gq|tk)(\/|$)/i.test(link)) trustScore -= 22;
  if (/(fake|scam|rumou?r|clickbait|hoax|misleading|adult)/i.test(haystack)) trustScore -= 18;

  return Math.max(10, Math.min(98, trustScore));
}

function buildCards(
  articles: Array<{
    title: string;
    url: string;
    source: string;
    description?: string;
  }>
): UniversalSourceCard[] {
  return articles.slice(0, 8).map((article) => {
    const trustScore = scoreSource(article.source, article.title, article.url);
    return {
      title: article.title,
      link: article.url,
      source: article.source,
      snippet: article.description,
      aiSummary:
        trustScore >= 80
          ? `${article.source} supports this result from a relatively credible context.`
          : trustScore < 45
            ? `${article.source} appears in search results, but the surrounding trust signals look weak.`
            : `${article.source} provides related public context that should be cross-checked.`,
      trustScore,
      suspicious: trustScore < 45
    };
  });
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getPageTitle(url: string) {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return "";
    const html = await response.text();
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

async function getDomainAge(domain: string) {
  try {
    const response = await fetchWithTimeout(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
    if (!response.ok) return "Unknown";
    const payload = (await response.json().catch(() => ({}))) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };
    const registration = payload.events?.find((event) => /registration/i.test(event.eventAction || ""));
    if (!registration?.eventDate) return "Unknown";
    const ageMs = Date.now() - new Date(registration.eventDate).getTime();
    const years = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365)));
    return years > 0 ? `${years} year${years === 1 ? "" : "s"}` : "Less than 1 year";
  } catch {
    return "Unknown";
  }
}

function sentimentLabel(text: string) {
  if (/(panic|shocking|terrible|urgent|danger|warning|scam)/i.test(text)) return "Elevated";
  if (/(safe|verified|official|trusted|calm)/i.test(text)) return "Calm";
  return "Neutral";
}

function buildResponse(input: {
  mode: UniversalContentMode;
  query: string;
  title?: string;
  score: number;
  explanation: string;
  tags: string[];
  cards: UniversalSourceCard[];
  metadata?: Record<string, string | number | boolean | null>;
}): UniversalAnalysisResponse {
  const verdict = getCategory(input.score);
  return {
    mode: input.mode,
    query: input.query,
    title: input.title,
    explanation: input.explanation,
    trustScore: Math.max(0, Math.min(100, 100 - input.score)),
    riskLevel: toRiskLevel(verdict),
    verdict,
    tags: Array.from(new Set(input.tags)),
    cards: input.cards,
    metadata: input.metadata
  };
}

export async function analyzeTextContent(text: string): Promise<UniversalAnalysisResponse> {
  const features = detectFeatures(text, null);
  const fact = await verifyClaim(text);
  let score = calculateScore(features, null, 0);
  if (fact.totalSources === 0) score += 25;
  if (fact.articles.some((article) => /(false|fake|rumou?r|hoax|misleading|denied)/i.test(`${article.title} ${article.description || ""}`))) {
    score += 30;
  }
  score = Math.min(100, score);

  const cards = buildCards(fact.articles);
  const reason = generateReason(features, score, null);

  return buildResponse({
    mode: "text",
    query: text,
    score,
    explanation: `${reason}. Sentiment looks ${sentimentLabel(text).toLowerCase()} and ${fact.totalSources ? `${fact.totalSources} related public sources were found.` : "no public sources were found."}`,
    tags: [
      ...(features.hasViralMisinformationPattern ? ["Viral Pattern"] : []),
      ...(features.hasSuspiciousClaimLanguage ? ["Suspicious Claim"] : []),
      ...(fact.totalSources === 0 ? ["Needs Verification"] : ["Live Sources Found"])
    ],
    cards,
    metadata: {
      sentiment: sentimentLabel(text),
      sourcesFound: fact.totalSources
    }
  });
}

export async function analyzeVideoContent(videoUrl: string): Promise<UniversalAnalysisResponse> {
  let title = "";
  let platform = "Unknown";
  try {
    const url = new URL(videoUrl);
    platform = url.hostname.replace(/^www\./, "");
    if (/youtube\.com|youtu\.be/.test(url.hostname)) {
      const oembed = await fetchWithTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      const payload = (await oembed.json().catch(() => ({}))) as { title?: string };
      title = payload.title || "";
      platform = "YouTube";
    } else if (/tiktok\.com/.test(url.hostname)) {
      const oembed = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
      const payload = (await oembed.json().catch(() => ({}))) as { title?: string; author_name?: string };
      title = payload.title || payload.author_name || "";
      platform = "TikTok";
    } else if (/instagram\.com/.test(url.hostname)) {
      platform = "Instagram";
    }
  } catch {
    // ignore
  }

  const query = title || videoUrl;
  const features = detectFeatures(query, null);
  const fact = await verifyClaim(query);
  let score = calculateScore(features, null, 0);
  if (/(shocking|must watch|you won't believe|secret|exposed)/i.test(query)) score += 20;
  if (fact.totalSources === 0) score += 20;
  score = Math.min(100, score);

  return buildResponse({
    mode: "video",
    query: videoUrl,
    title: title || "Video analysis",
    score,
    explanation: `${platform} metadata was analyzed for clickbait, misinformation, and credibility signals.${fact.totalSources ? ` ${fact.totalSources} related public results were found.` : " No related public results were found."}`,
    tags: [
      platform,
      ...(fact.totalSources === 0 ? ["Unverified Video"] : ["Cross-platform Matches"]),
      ...(/(shocking|must watch|you won't believe|secret|exposed)/i.test(query) ? ["Clickbait Signals"] : [])
    ],
    cards: buildCards(fact.articles),
    metadata: {
      platform,
      title: title || "Unknown",
      sourcesFound: fact.totalSources
    }
  });
}

export async function analyzeUrlContent(targetUrl: string): Promise<UniversalAnalysisResponse> {
  const urlInfo = analyzeUrl(targetUrl);
  const title = await getPageTitle(targetUrl);
  const searchQuery = title || urlInfo.domain || targetUrl;
  const fact = await verifyClaim(searchQuery);
  const features = detectFeatures(`${targetUrl} ${title}`, null);
  const score = Math.min(100, calculateScore(features, null, urlInfo.riskScore) + (fact.totalSources === 0 ? 10 : 0));

  return buildResponse({
    mode: "url",
    query: targetUrl,
    title: title || urlInfo.domain,
    score,
    explanation: `${urlInfo.isSuspicious ? "URL structure looks risky." : "URL structure looks relatively clean."} ${urlInfo.riskFlags.length ? urlInfo.riskFlags.join(", ") + "." : ""} ${fact.totalSources ? `${fact.totalSources} search results were found for this domain or page.` : "No public search confirmation was found for this page."}`,
    tags: [
      ...(urlInfo.riskFlags.length ? urlInfo.riskFlags.slice(0, 3) : ["No strong phishing flags"]),
      ...(fact.totalSources === 0 ? ["Low Search Visibility"] : ["Public Presence Found"])
    ],
    cards: buildCards(fact.articles),
    metadata: {
      domain: urlInfo.domain || "Unknown",
      ssl: targetUrl.startsWith("https://"),
      domainAge: urlInfo.domain ? await getDomainAge(urlInfo.domain) : "Unknown",
      sourcesFound: fact.totalSources
    }
  });
}
