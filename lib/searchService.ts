import { TrustSimilarity, TrustSource, VerificationSourceHit } from "@/lib/types";

type SearchIntent = "web" | "news";

type SearchHit = VerificationSourceHit & {
  thumbnail?: string;
  domain: string;
  rank: number;
  query: string;
};

const TRUSTED_REPORT_DOMAINS = [
  "openai.com",
  "wikipedia.org",
  "github.com",
  "learn.microsoft.com",
  "microsoft.com",
  "reuters.com",
  "bbc.com",
  "apnews.com",
  "theverge.com",
  "techcrunch.com",
  "wired.com",
  "arstechnica.com",
  "youtube.com"
];

const TOOL_HINTS = [
  "tool",
  "tools",
  "software",
  "platform",
  "assistant",
  "editor",
  "coding",
  "developer",
  "copilot",
  "ai",
  "code",
  "extension",
  "plugin",
  "ide",
  "competitor",
  "alternative"
];

const ALTERNATIVE_TOOL_BRANDS = ["cursor", "copilot", "codeium", "tabnine", "windsurf", "replit", "sourcegraph", "cline", "bolt"];
const NEWS_LIKE_DOMAINS = ["news", "reuters", "bbc", "apnews", "techradar", "macrumors", "benzinga", "indiatoday", "theverge", "wired"];
const TOOL_BRAND_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bcursor\b/i, label: "Cursor" },
  { pattern: /\bcopilot\b/i, label: "GitHub Copilot" },
  { pattern: /\bcodeium\b/i, label: "Codeium" },
  { pattern: /\bclaude code\b/i, label: "Claude Code" },
  { pattern: /\btabnine\b/i, label: "Tabnine" },
  { pattern: /\bwindsurf\b/i, label: "Windsurf" },
  { pattern: /\breplit\b/i, label: "Replit" },
  { pattern: /\bsourcegraph\b/i, label: "Sourcegraph Cody" },
  { pattern: /\bcline\b/i, label: "Cline" },
  { pattern: /\bbolt\b/i, label: "Bolt" },
  { pattern: /\bgemini\b/i, label: "Gemini Code Assist" }
];
const OFFICIAL_SITE_MAP: Array<{ pattern: RegExp; title: string; url: string; source: string }> = [
  { pattern: /\bopenai\b/i, title: "OpenAI official site", url: "https://openai.com", source: "openai.com" },
  { pattern: /\bgithub\b/i, title: "GitHub official site", url: "https://github.com", source: "github.com" },
  { pattern: /\bmicrosoft\b/i, title: "Microsoft official site", url: "https://www.microsoft.com", source: "microsoft.com" },
  { pattern: /\bcursor\b/i, title: "Cursor official site", url: "https://www.cursor.com", source: "cursor.com" },
  { pattern: /\bcodeium\b/i, title: "Codeium official site", url: "https://codeium.com", source: "codeium.com" },
  { pattern: /\bcopilot\b/i, title: "GitHub Copilot official site", url: "https://github.com/features/copilot", source: "github.com" },
  { pattern: /\btabnine\b/i, title: "Tabnine official site", url: "https://www.tabnine.com", source: "tabnine.com" },
  { pattern: /\bwindsurf\b/i, title: "Windsurf official site", url: "https://windsurf.com", source: "windsurf.com" },
  { pattern: /\breplit\b/i, title: "Replit official site", url: "https://replit.com", source: "replit.com" },
  { pattern: /\bsourcegraph\b/i, title: "Sourcegraph official site", url: "https://sourcegraph.com", source: "sourcegraph.com" },
  { pattern: /\bcline\b/i, title: "Cline official site", url: "https://cline.bot", source: "cline.bot" },
  { pattern: /\bbolt\b/i, title: "Bolt official site", url: "https://bolt.new", source: "bolt.new" }
];

const BLOCKED_PATTERNS = [
  /apk/i,
  /mod apk/i,
  /crack/i,
  /torrent/i,
  /nulled/i,
  /softonic/i,
  /uptodown/i,
  /getintopc/i,
  /filehippo/i,
  /download/i,
  /free\s+download/i
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function env(name: string) {
  const aliases: Record<string, string[]> = {
    SERPAPI_KEY: ["SERPAPI_KEY", "SERP_API_KEY"],
    BING_SEARCH_API_KEY: ["BING_SEARCH_API_KEY", "BING_API_KEY"]
  };

  const value = (aliases[name] || [name]).map((key) => process.env[key]).find(Boolean);
  return value && !/^(change-me|your-|your_|example|placeholder)/i.test(value) ? value : "";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(url: string, init?: RequestInit, retries = 1): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status !== 429 || attempt === retries) {
        return null;
      }
    } catch {
      if (attempt === retries) return null;
    }

    await wait(250 * (attempt + 1));
  }

  return null;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function faviconForUrl(value: string) {
  const hostname = hostnameFromUrl(value);
  return hostname ? `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(`https://${hostname}`)}` : "";
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !["the", "and", "for", "with", "from", "official", "overview"].includes(token));
}

function hasBlockedContent(hit: Pick<SearchHit, "title" | "snippet" | "url" | "source" | "domain">) {
  const haystack = `${hit.title} ${hit.snippet || ""} ${hit.source} ${hit.url} ${hit.domain}`.toLowerCase();
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(haystack));
}

function uniqueHits<T extends { url: string; title: string }>(hits: T[]) {
  return hits.filter(
    (hit, index, all) => all.findIndex((candidate) => candidate.url === hit.url || candidate.title.toLowerCase() === hit.title.toLowerCase()) === index
  );
}

function findOfficialSiteForLabel(label: string) {
  const normalized = label.toLowerCase();
  return OFFICIAL_SITE_MAP.find((item) => item.title.toLowerCase().includes(normalized) || item.source.toLowerCase().includes(normalized.replace(/^github /, "")));
}

async function searchSerpApi(query: string, intent: SearchIntent, count = 8): Promise<SearchHit[]> {
  const apiKey = env("SERPAPI_KEY");
  if (!apiKey) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(count));
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  if (intent === "news") {
    url.searchParams.set("tbm", "nws");
  }

  const payload = await fetchJsonWithRetry<{
    organic_results?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      source?: string;
      displayed_link?: string;
      thumbnail?: string;
    }>;
    news_results?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      source?: string;
      date?: string;
      thumbnail?: string;
    }>;
  }>(url.toString(), undefined, 2);

  if (!payload) return [];

  if (intent === "news") {
    return (payload.news_results || [])
      .filter((item) => item.title && item.link)
      .map((item, index) => {
        const urlValue = item.link || "";
        const domain = hostnameFromUrl(urlValue);
        return {
          title: item.title || "Search result",
          source: item.source || domain || "Google News",
          url: urlValue,
          snippet: item.snippet,
          sourceType: "news" as const,
          thumbnail: item.thumbnail || faviconForUrl(urlValue),
          domain,
          rank: index,
          query
        };
      });
  }

  return (payload.organic_results || [])
    .filter((item) => item.title && item.link)
    .map((item, index) => {
      const urlValue = item.link || "";
      const domain = hostnameFromUrl(urlValue);
      return {
        title: item.title || "Search result",
        source: item.source || item.displayed_link || domain || "Google",
        url: urlValue,
        snippet: item.snippet,
        sourceType: "search" as const,
        thumbnail: item.thumbnail || faviconForUrl(urlValue),
        domain,
        rank: index,
        query
      };
    });
}

async function searchBing(query: string, intent: SearchIntent, count = 8): Promise<SearchHit[]> {
  const apiKey = env("BING_SEARCH_API_KEY");
  if (!apiKey) return [];

  const url = new URL("https://api.bing.microsoft.com/v7.0/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("mkt", "en-US");
  url.searchParams.set("safeSearch", "Moderate");
  url.searchParams.set("responseFilter", intent === "news" ? "News" : "Webpages");

  const payload = await fetchJsonWithRetry<{
    webPages?: { value?: Array<{ name?: string; url?: string; snippet?: string; displayUrl?: string }> };
    news?: {
      value?: Array<{
        name?: string;
        url?: string;
        description?: string;
        provider?: Array<{ name?: string }>;
        image?: { thumbnail?: { contentUrl?: string } };
      }>;
    };
  }>(url.toString(), { headers: { "Ocp-Apim-Subscription-Key": apiKey } }, 2);

  if (!payload) return [];

  if (intent === "news") {
    return (payload.news?.value || [])
      .filter((item) => item.name && item.url)
      .map((item, index) => {
        const urlValue = item.url || "";
        const domain = hostnameFromUrl(urlValue);
        return {
          title: item.name || "Search result",
          source: item.provider?.[0]?.name || domain || "Bing News",
          url: urlValue,
          snippet: item.description,
          sourceType: "news" as const,
          thumbnail: item.image?.thumbnail?.contentUrl || faviconForUrl(urlValue),
          domain,
          rank: index,
          query
        };
      });
  }

  return (payload.webPages?.value || [])
    .filter((item) => item.name && item.url)
    .map((item, index) => {
      const urlValue = item.url || "";
      const domain = hostnameFromUrl(urlValue);
      return {
        title: item.name || "Search result",
        source: item.displayUrl || domain || "Bing",
        url: urlValue,
        snippet: item.snippet,
        sourceType: "search" as const,
        thumbnail: faviconForUrl(urlValue),
        domain,
        rank: index,
        query
      };
    });
}

async function searchProvider(query: string, intent: SearchIntent, count = 8) {
  const primary = await searchSerpApi(query, intent, count);
  if (primary.length) return primary;
  return searchBing(query, intent, count);
}

async function searchConfiguredNewsHits(query: string, limit = 6): Promise<SearchHit[]> {
  if (!query) return [];

  const gnewsKey = env("GNEWS_API_KEY");
  const newsApiKey = env("NEWS_API_KEY");
  const hits: SearchHit[] = [];

  if (gnewsKey) {
    const url = new URL("https://gnews.io/api/v4/search");
    url.searchParams.set("q", query);
    url.searchParams.set("lang", "en");
    url.searchParams.set("max", String(limit));
    url.searchParams.set("token", gnewsKey);

    const payload = await fetchJsonWithRetry<{
      articles?: Array<{ title?: string; description?: string; url?: string; image?: string; source?: { name?: string } }>;
    }>(url.toString(), undefined, 2);

    for (const [index, item] of (payload?.articles || []).entries()) {
      if (!item.title || !item.url) continue;
      const domain = hostnameFromUrl(item.url);
      hits.push({
        title: item.title,
        source: item.source?.name || domain || "GNews",
        url: item.url,
        snippet: item.description,
        sourceType: "news",
        thumbnail: item.image || faviconForUrl(item.url),
        domain,
        rank: index,
        query
      });
    }
  }

  if (newsApiKey) {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", String(limit));
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("apiKey", newsApiKey);

    const payload = await fetchJsonWithRetry<{
      articles?: Array<{ title?: string; description?: string; url?: string; urlToImage?: string; source?: { name?: string } }>;
    }>(url.toString(), undefined, 2);

    for (const [index, item] of (payload?.articles || []).entries()) {
      if (!item.title || !item.url) continue;
      const domain = hostnameFromUrl(item.url);
      hits.push({
        title: item.title,
        source: item.source?.name || domain || "News API",
        url: item.url,
        snippet: item.description,
        sourceType: "news",
        thumbnail: item.urlToImage || faviconForUrl(item.url),
        domain,
        rank: index,
        query
      });
    }
  }

  return uniqueHits(hits);
}

async function searchWikipediaSource(query: string): Promise<TrustSource[]> {
  if (!query) return [];

  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("utf8", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", "2");

  const payload = await fetchJsonWithRetry<{
    query?: { search?: Array<{ title?: string; snippet?: string }> };
  }>(url.toString(), undefined, 2);

  return (payload?.query?.search || [])
    .filter((item) => item.title)
    .map((item) => {
      const title = item.title || "Wikipedia result";
      return {
        image: faviconForUrl("https://en.wikipedia.org"),
        source: "wikipedia.org",
        title,
        author: "Wikipedia",
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
        description: (item.snippet || "").replace(/<[^>]+>/g, ""),
        platform: "knowledge"
      } satisfies TrustSource;
    });
}

function scoreReportHit(topic: string, hit: SearchHit) {
  const tokens = tokenize(topic);
  const haystack = `${hit.title} ${hit.snippet || ""} ${hit.source} ${hit.domain}`.toLowerCase();
  let score = 30;

  const overlap = tokens.filter((token) => haystack.includes(token)).length;
  score += overlap * 9;

  if (TRUSTED_REPORT_DOMAINS.some((domain) => hit.domain === domain || hit.domain.endsWith(`.${domain}`))) score += 25;
  if (/\bofficial|documentation|overview|guide|wikipedia|news|announcement|blog\b/i.test(haystack)) score += 12;
  if (/\bopenai|github|microsoft|wikipedia\b/i.test(haystack)) score += 18;
  if (/\bscam|warning|phishing|fraud|fake|imposter\b/i.test(haystack)) score += 10;
  if (hit.rank < 3) score += 8 - hit.rank * 2;
  if (hasBlockedContent(hit)) score -= 100;

  return score;
}

function scoreSimilarityHit(topic: string, hit: SearchHit) {
  const tokens = tokenize(topic);
  const haystack = `${hit.title} ${hit.snippet || ""} ${hit.source} ${hit.domain}`.toLowerCase();
  let score = 40;

  const overlap = tokens.filter((token) => haystack.includes(token)).length;
  score += overlap * 8;

  if (/\balternative|competitor|compare|comparison|similar|vs\b/i.test(haystack)) score += 20;
  if (TOOL_HINTS.some((keyword) => haystack.includes(keyword))) score += 12;
  if (ALTERNATIVE_TOOL_BRANDS.some((brand) => haystack.includes(brand))) score += 28;
  if (NEWS_LIKE_DOMAINS.some((fragment) => hit.domain.includes(fragment)) && !TOOL_HINTS.some((keyword) => haystack.includes(keyword))) score -= 40;
  if (/\bnews|announced|reported|says|today\b/i.test(haystack) && !ALTERNATIVE_TOOL_BRANDS.some((brand) => haystack.includes(brand))) score -= 25;
  if (/\bopenai codex\b/i.test(haystack) && tokens.includes("codex")) score -= 18;
  if (hasBlockedContent(hit)) score -= 100;

  return score;
}

function appearsRelevantToTopic(topic: string, hit: SearchHit) {
  const tokens = tokenize(topic);
  const haystack = `${hit.title} ${hit.snippet || ""} ${hit.source} ${hit.domain}`.toLowerCase();
  return tokens.length === 0 || tokens.some((token) => haystack.includes(token));
}

function looksLikeToolResult(hit: SearchHit) {
  const haystack = `${hit.title} ${hit.snippet || ""} ${hit.source} ${hit.domain}`.toLowerCase();
  return TOOL_HINTS.some((keyword) => haystack.includes(keyword)) || ALTERNATIVE_TOOL_BRANDS.some((brand) => haystack.includes(brand));
}

function extractBrandSimilarities(topic: string, hits: SearchHit[]) {
  const topicLower = topic.toLowerCase();
  const candidates: TrustSimilarity[] = [];

  for (const hit of hits) {
    const haystack = `${hit.title} ${hit.snippet || ""}`.toLowerCase();
    for (const brand of TOOL_BRAND_LABELS) {
      if (!brand.pattern.test(haystack)) continue;
      if (topicLower.includes(brand.label.toLowerCase())) continue;
      const official = findOfficialSiteForLabel(brand.label);

      candidates.push({
        title: brand.label,
        url: official?.url || hit.url,
        image: official ? faviconForUrl(official.url) : hit.thumbnail || faviconForUrl(hit.url),
        matchPercentage: clamp(scoreSimilarityHit(topic, hit) + 10, 55, 92),
        source: official?.source || hit.domain || hit.source,
        description: hit.snippet || `${brand.label} appeared in a live comparison or competitor result.`
      });
    }
  }

  return uniqueHits(
    candidates.map((item) => ({
      title: item.title,
      url: item.url || "#",
      snippet: item.description,
      source: item.source
    }))
  ).map((item) => ({
    title: item.title,
    url: item.url,
    image: faviconForUrl(item.url),
    matchPercentage: 72,
    source: item.source,
    description: item.snippet
  }));
}

function deriveOfficialFallbacks(topic: string, hits: SearchHit[]) {
  const topicMatches = OFFICIAL_SITE_MAP.filter((item) => item.pattern.test(topic));
  const mentionMatches = OFFICIAL_SITE_MAP.map((item) => ({
    item,
    mentions: hits.reduce((count, hit) => count + Number(item.pattern.test(`${hit.title} ${hit.snippet || ""}`)), 0)
  }))
    .filter((entry) => entry.mentions >= 2)
    .sort((left, right) => right.mentions - left.mentions)
    .slice(0, 2)
    .map((entry) => entry.item);

  return uniqueHits(
    [...topicMatches, ...mentionMatches].map((item) => ({
      title: item.title,
      url: item.url
    }))
  ).map(({ title, url }) => {
    const item = OFFICIAL_SITE_MAP.find((candidate) => candidate.title === title && candidate.url === url);
    if (!item) return null;
    return {
      image: faviconForUrl(item.url),
      source: item.source,
      title: item.title,
      author: item.source,
      link: item.url,
      description: `Official reference for ${item.title.replace(/ official site$/i, "")}.`,
      platform: "web"
    } satisfies TrustSource;
  }).filter(Boolean) as TrustSource[];
}

function toReportSource(hit: SearchHit): TrustSource {
  return {
    image: hit.thumbnail || faviconForUrl(hit.url),
    source: hit.domain || hit.source,
    title: hit.title,
    author: hit.source,
    link: hit.url,
    description: hit.snippet || "Live source returned by the TruthChain-X search layer.",
    platform: hit.sourceType === "news" ? "news" : "search"
  };
}

function toSimilarity(hit: SearchHit, matchPercentage: number): TrustSimilarity {
  return {
    title: hit.title,
    url: hit.url,
    image: hit.thumbnail || faviconForUrl(hit.url),
    matchPercentage,
    source: hit.domain || hit.source,
    description: hit.snippet || "Related product or platform found in live search results."
  };
}

export async function searchNews(query: string): Promise<VerificationSourceHit[]> {
  const hits = await searchConfiguredNewsHits(query, 6);
  return hits.map(({ thumbnail, domain, rank, query: originalQuery, ...hit }) => hit);
}

export async function searchWeb(query: string): Promise<VerificationSourceHit[]> {
  const hits = await searchProvider(query, "web", 6);
  return hits.map(({ thumbnail, domain, rank, query: originalQuery, ...hit }) => hit);
}

export async function searchFactChecks(query: string): Promise<VerificationSourceHit[]> {
  const apiKey = env("GOOGLE_FACT_CHECK_API_KEY");
  if (!apiKey || !query) return [];

  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("pageSize", "4");

  const payload = await fetchJsonWithRetry<{
    claims?: Array<{
      text?: string;
      claimant?: string;
      claimReview?: Array<{ publisher?: { name?: string; site?: string }; url?: string; title?: string; textualRating?: string }>;
    }>;
  }>(url.toString(), undefined, 2);

  return (payload?.claims || []).flatMap((claim) =>
    (claim.claimReview || [])
      .filter((review) => review.url)
      .map((review) => ({
        title: review.title || claim.text || "Fact check result",
        source: review.publisher?.name || claim.claimant || "Fact Check",
        url: review.url || "",
        snippet: review.textualRating,
        sourceType: "fact-check" as const,
        thumbnail: faviconForUrl(review.url || "")
      }))
  );
}

export async function searchReportSources(topic: string, options?: { officialUrl?: string; limit?: number }) {
  const cleanTopic = topic.trim();
  if (!cleanTopic) return [];

  const queries = [
    `${cleanTopic} official`,
    `${cleanTopic} overview`,
    `${cleanTopic} scam OR fake`,
    `${cleanTopic} news`
  ];

  const [webOfficial, webOverview, webScam, newsResults] = await Promise.all([
    searchProvider(queries[0], "web", 5),
    searchProvider(queries[1], "web", 5),
    searchProvider(queries[2], "web", 5),
    searchConfiguredNewsHits(queries[3], 5)
  ]);

  const combined = uniqueHits([...webOfficial, ...webOverview, ...webScam, ...newsResults])
    .filter((hit) => !hasBlockedContent(hit))
    .filter((hit) => appearsRelevantToTopic(cleanTopic, hit))
    .map((hit) => ({ hit, score: scoreReportHit(cleanTopic, hit) }))
    .filter((item) => item.score > 8)
    .sort((left, right) => right.score - left.score);

  const prioritized = combined
    .map(({ hit }) => hit)
    .filter((hit, index, all) => all.findIndex((candidate) => candidate.domain === hit.domain || candidate.url === hit.url) === index);

  let sources = prioritized.slice(0, options?.limit ?? 8).map(toReportSource);
  sources = mergeReportSourcesFromFallback(deriveOfficialFallbacks(cleanTopic, prioritized), sources);
  const wikiFallback = await searchWikipediaSource(cleanTopic);
  sources = mergeReportSourcesFromFallback(sources, wikiFallback);

  if (options?.officialUrl) {
    const officialDomain = hostnameFromUrl(options.officialUrl);
    const officialSource: TrustSource = {
      image: faviconForUrl(options.officialUrl),
      source: officialDomain || "official",
      title: `${cleanTopic} official site`,
      author: officialDomain || "official",
      link: options.officialUrl,
      description: "Official source reference.",
      platform: "web"
    };

    return uniqueHits(
      [officialSource, ...sources].map((source) => ({ ...source, url: source.link }))
    ).map(({ url, ...source }) => ({ ...source, link: url }));
  }

  return sources;
}

export async function searchSimilaritySources(topic: string, limit = 6) {
  const cleanTopic = topic.trim();
  if (!cleanTopic) return [];

  const queries = [
    `${cleanTopic} alternatives ai coding assistant`,
    `${cleanTopic} competitors developer tools`,
    `${cleanTopic} vs cursor copilot codeium`
  ];

  const results = await Promise.all(queries.map((query) => searchProvider(query, "web", 6)));
  let combined = uniqueHits(results.flat())
    .filter((hit) => !hasBlockedContent(hit))
    .filter((hit) => appearsRelevantToTopic(cleanTopic, hit))
    .filter((hit) => looksLikeToolResult(hit))
    .map((hit) => ({ hit, score: scoreSimilarityHit(cleanTopic, hit) }))
    .filter((item) => item.score >= 42)
    .sort((left, right) => right.score - left.score);

  if (!combined.length) {
    const newsFallback = await searchConfiguredNewsHits(`${cleanTopic} alternatives competitors`, 6);
    combined = uniqueHits(newsFallback)
      .filter((hit) => appearsRelevantToTopic(cleanTopic, hit))
      .filter((hit) => looksLikeToolResult(hit))
      .map((hit) => ({ hit, score: scoreSimilarityHit(cleanTopic, hit) }))
      .filter((item) => item.score >= 36)
      .sort((left, right) => right.score - left.score);
  }

  const directMatches = combined
    .slice(0, limit)
    .map(({ hit, score }) => toSimilarity(hit, Math.max(52, Math.min(95, score))));

  const fallbackHits = uniqueHits([...results.flat(), ...(await searchConfiguredNewsHits(`${cleanTopic} alternatives competitors`, 8))]);
  const brandMatches = extractBrandSimilarities(cleanTopic, fallbackHits);
  if (brandMatches.length >= 2) {
    return brandMatches.slice(0, limit);
  }

  return uniqueHits(
    [...brandMatches, ...directMatches].map((item) => ({
      title: item.title,
      url: item.url || "#",
      snippet: item.description,
      source: item.source
    }))
  )
    .map((item) => ({
      title: item.title,
      url: item.url,
      image: faviconForUrl(item.url),
      matchPercentage: 72,
      source: item.source,
      description: item.snippet
    }))
    .slice(0, limit);
}

function mergeReportSourcesFromFallback(primary: TrustSource[], fallback: TrustSource[]) {
  return uniqueHits(
    [...primary, ...fallback].map((source) => ({
      title: source.title,
      url: source.link,
      snippet: source.description,
      source: source.source
    }))
  ).map((source) => ({
    image: faviconForUrl(source.url),
    source: source.source || hostnameFromUrl(source.url),
    title: source.title,
    author: source.source || hostnameFromUrl(source.url),
    link: source.url,
    description: source.snippet,
    platform: "web"
  }));
}
