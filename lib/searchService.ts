import { VerificationSourceHit } from "@/lib/types";

function env(name: string) {
  const aliases: Record<string, string[]> = {
    SERPAPI_KEY: ["SERPAPI_KEY", "SERP_API_KEY"]
  };
  const value = (aliases[name] || [name]).map((key) => process.env[key]).find(Boolean);
  return value && !/^(change-me|your-|example|placeholder)/i.test(value) ? value : "";
}

async function fetchJsonWithRetry<T>(url: URL, retries = 1): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { next: { revalidate: 900 } });
      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status !== 429 || attempt === retries) {
        return null;
      }
    } catch {
      if (attempt === retries) return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }

  return null;
}

export async function searchNews(query: string): Promise<VerificationSourceHit[]> {
  if (!query) return [];
  const apiKey = env("NEWS_API_KEY") || env("GNEWS_API_KEY");
  if (!apiKey) return [];

  if (env("NEWS_API_KEY")) {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "4");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("apiKey", env("NEWS_API_KEY"));

    const payload = await fetchJsonWithRetry<{
      articles?: Array<{ title?: string; description?: string; url?: string; publishedAt?: string; source?: { name?: string } }>;
    }>(url, 2);

    return (payload?.articles || [])
      .filter((article) => article.title && article.url)
      .map((article) => ({
        title: article.title || "News match",
        source: article.source?.name || "News API",
        url: article.url || "",
        snippet: article.description,
        publishedAt: article.publishedAt,
        sourceType: "news" as const
      }));
  }

  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", "4");
  url.searchParams.set("token", env("GNEWS_API_KEY"));

  const payload = await fetchJsonWithRetry<{
    articles?: Array<{ title?: string; description?: string; url?: string; publishedAt?: string; source?: { name?: string } }>;
  }>(url, 2);

  return (payload?.articles || [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      title: article.title || "GNews match",
      source: article.source?.name || "GNews",
      url: article.url || "",
      snippet: article.description,
      publishedAt: article.publishedAt,
      sourceType: "news" as const
    }));
}

export async function searchWeb(query: string): Promise<VerificationSourceHit[]> {
  if (!query) return [];

  const googleApiKey = env("GOOGLE_SEARCH_API_KEY");
  const cseId = env("GOOGLE_CSE_ID");
  if (googleApiKey && cseId) {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", googleApiKey);
    url.searchParams.set("cx", cseId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "4");

    const payload = await fetchJsonWithRetry<{
      items?: Array<{ title?: string; link?: string; snippet?: string; displayLink?: string }>;
    }>(url, 2);

    return (payload?.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title || "Search result",
        source: item.displayLink || "Google Search",
        url: item.link || "",
        snippet: item.snippet,
        sourceType: "search" as const
      }));
  }

  const serpApiKey = env("SERPAPI_KEY");
  if (!serpApiKey) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", serpApiKey);

  const payload = await fetchJsonWithRetry<{
    organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  }>(url, 2);

  return (payload?.organic_results || [])
    .filter((item) => item.title && item.link)
    .slice(0, 4)
    .map((item) => ({
      title: item.title || "Search result",
      source: "Google Search",
      url: item.link || "",
      snippet: item.snippet,
      sourceType: "search" as const
    }));
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
  }>(url, 2);

  return (payload?.claims || []).flatMap((claim) =>
    (claim.claimReview || [])
      .filter((review) => review.url)
      .map((review) => ({
        title: review.title || claim.text || "Fact check result",
        source: review.publisher?.name || claim.claimant || "Fact Check",
        url: review.url || "",
        snippet: review.textualRating,
        sourceType: "fact-check" as const
      }))
  );
}
