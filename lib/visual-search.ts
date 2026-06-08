import { uploadImageToCloudinary } from "@/lib/image-search";
import { VisualSearchResponse, VisualSearchResult } from "@/lib/types";

type VisualSearchParams = {
  query?: string;
  imageUrl?: string;
  imageData?: string;
  page?: number;
  pageSize?: number;
};

const BLOCKED_DOMAINS = [
  "softonic.com",
  "uptodown.com",
  "apkcombo.com",
  "apkpure.com",
  "getintopc.com",
  "filehippo.com",
  "pinterestdownloader.com"
];

const PLATFORM_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /instagram/i, label: "Instagram" },
  { pattern: /tiktok/i, label: "TikTok" },
  { pattern: /\bx\.com\b|twitter/i, label: "X" },
  { pattern: /youtube/i, label: "YouTube" },
  { pattern: /facebook/i, label: "Facebook" },
  { pattern: /reddit/i, label: "Reddit" },
  { pattern: /pinterest/i, label: "Pinterest" },
  { pattern: /linkedin/i, label: "LinkedIn" },
  { pattern: /github/i, label: "GitHub" },
  { pattern: /wikipedia/i, label: "Wikipedia" }
];

function env(name: string) {
  const aliases: Record<string, string[]> = {
    SERPAPI_KEY: ["SERPAPI_KEY", "SERP_API_KEY"],
    BING_SEARCH_API_KEY: ["BING_SEARCH_API_KEY", "BING_API_KEY"]
  };

  const value = (aliases[name] || [name]).map((key) => process.env[key]).find(Boolean);
  return value && !/^(change-me|your-|your_|example|placeholder)/i.test(value) ? value : "";
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function titleCaseHostname(hostname: string) {
  if (!hostname) return "Web";
  const label = hostname.split(".")[0] || hostname;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function platformFromLink(link: string, source?: string) {
  const haystack = `${source || ""} ${hostnameFromUrl(link)}`.toLowerCase();
  return PLATFORM_LABELS.find((item) => item.pattern.test(haystack))?.label || titleCaseHostname(hostnameFromUrl(link));
}

function isBlocked(link: string, title: string, source: string) {
  const hostname = hostnameFromUrl(link);
  const haystack = `${hostname} ${title} ${source}`.toLowerCase();
  return BLOCKED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) || /\bapk|crack|torrent|download\b/i.test(haystack);
}

function normalizeDescription(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function cleanResults(results: VisualSearchResult[], pageSize: number) {
  return results
    .filter((item) => item.link && item.title && item.thumbnail && !isBlocked(item.link, item.title, item.source))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.link === item.link || `${candidate.title}:${candidate.source}`.toLowerCase() === `${item.title}:${item.source}`.toLowerCase()) === index)
    .slice(0, pageSize);
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  return { ok: response.ok, status: response.status, payload };
}

async function searchSerpApiByText(query: string, page: number, pageSize: number) {
  const apiKey = env("SERPAPI_KEY");
  if (!apiKey) return { results: [] as VisualSearchResult[], available: false };

  const start = page * pageSize;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("ijn", String(page));
  url.searchParams.set("num", String(pageSize));
  url.searchParams.set("safe", "active");
  if (start) url.searchParams.set("start", String(start));

  const { ok, payload, status } = await fetchJson<{
    images_results?: Array<{
      original?: string;
      thumbnail?: string;
      title?: string;
      source?: string;
      link?: string;
      original_width?: number;
      original_height?: number;
    }>;
  }>(url.toString());

  if (!ok) {
    if (status === 401 || /invalid api key/i.test(payload.error || payload.message || "")) {
      return { results: [] as VisualSearchResult[], available: false };
    }
    throw new Error(payload.error || payload.message || "SerpAPI image search failed.");
  }

  return {
    results: cleanResults(
      (payload.images_results || []).map((item, index) => {
        const link = item.link || "";
        const source = item.source || hostnameFromUrl(link) || "Web";
        return {
          id: `${link}-${index}`,
          image: item.original || item.thumbnail || "",
          thumbnail: item.thumbnail || item.original || "",
          title: item.title || source,
          source,
          platform: platformFromLink(link, source),
          link,
          description: normalizeDescription(item.title),
          width: item.original_width,
          height: item.original_height
        } satisfies VisualSearchResult;
      }),
      pageSize
    ),
    available: true
  };
}

async function searchSerpApiByImage(params: { imageUrl?: string; imageData?: string; page: number; pageSize: number }) {
  const apiKey = env("SERPAPI_KEY");
  if (!apiKey) return { results: [] as VisualSearchResult[], available: false, note: "SERPAPI_KEY is missing." };

  let publicImageUrl = params.imageUrl && /^https?:\/\//i.test(params.imageUrl) ? params.imageUrl : "";
  if (!publicImageUrl && params.imageData) {
    publicImageUrl = await uploadImageToCloudinary(params.imageData);
  }

  if (!publicImageUrl) {
    throw new Error("Visual search needs a public image URL or Cloudinary upload configuration.");
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_lens");
  url.searchParams.set("url", publicImageUrl);
  url.searchParams.set("type", "visual_matches");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("hl", "en");
  url.searchParams.set("country", "us");

  const { ok, payload, status } = await fetchJson<{
    visual_matches?: Array<{
      thumbnail?: string;
      image?: string;
      title?: string;
      link?: string;
      source?: string;
    }>;
  }>(url.toString());

  if (!ok) {
    if (status === 401 || /invalid api key/i.test(payload.error || payload.message || "")) {
      return { results: [] as VisualSearchResult[], available: false, note: "SerpAPI credentials are invalid." };
    }
    throw new Error(payload.error || payload.message || "SerpAPI visual search failed.");
  }

  return {
    results: cleanResults(
      (payload.visual_matches || []).map((item, index) => {
        const link = item.link || "";
        const source = item.source || hostnameFromUrl(link) || "Web";
        return {
          id: `${link}-${index}`,
          image: item.image || item.thumbnail || publicImageUrl,
          thumbnail: item.thumbnail || item.image || publicImageUrl,
          title: item.title || source,
          source,
          platform: platformFromLink(link, source),
          link,
          description: normalizeDescription(item.title)
        } satisfies VisualSearchResult;
      }),
      params.pageSize
    ),
    available: true,
    note: publicImageUrl
  };
}

async function searchBingByText(query: string, page: number, pageSize: number) {
  const apiKey = env("BING_SEARCH_API_KEY");
  if (!apiKey) return { results: [] as VisualSearchResult[], available: false };

  const offset = page * pageSize;
  const url = new URL("https://api.bing.microsoft.com/v7.0/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(pageSize));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("mkt", "en-US");
  url.searchParams.set("safeSearch", "Moderate");

  const { ok, payload } = await fetchJson<{
    value?: Array<{
      contentUrl?: string;
      thumbnailUrl?: string;
      hostPageUrl?: string;
      hostPageDisplayUrl?: string;
      hostPageDomainFriendlyName?: string;
      name?: string;
      width?: number;
      height?: number;
    }>;
  }>(url.toString(), { headers: { "Ocp-Apim-Subscription-Key": apiKey } });

  if (!ok) return { results: [] as VisualSearchResult[], available: false };

  return {
    results: cleanResults(
      (payload.value || []).map((item, index) => {
        const link = item.hostPageUrl || item.hostPageDisplayUrl || item.contentUrl || "";
        const source = item.hostPageDomainFriendlyName || hostnameFromUrl(link) || "Web";
        return {
          id: `${link}-${index}`,
          image: item.contentUrl || item.thumbnailUrl || "",
          thumbnail: item.thumbnailUrl || item.contentUrl || "",
          title: item.name || source,
          source,
          platform: platformFromLink(link, source),
          link,
          description: normalizeDescription(item.name),
          width: item.width,
          height: item.height
        } satisfies VisualSearchResult;
      }),
      pageSize
    ),
    available: true
  };
}

export async function runVisualSearch(params: VisualSearchParams): Promise<VisualSearchResponse> {
  const page = Math.max(0, params.page || 0);
  const pageSize = Math.max(8, Math.min(params.pageSize || 12, 24));
  const query = params.query?.trim() || "";
  const mode = params.imageData || params.imageUrl ? "image" : "text";

  if (mode === "text" && !query) {
    throw new Error("Add a text query before starting visual search.");
  }

  if (mode === "image" && !params.imageData && !params.imageUrl) {
    throw new Error("Add an image before starting visual search.");
  }

  if (mode === "image") {
    const serp = await searchSerpApiByImage({
      imageData: params.imageData,
      imageUrl: params.imageUrl,
      page,
      pageSize
    });

    return {
      query: query || "Visual search",
      mode,
      results: serp.results,
      page,
      pageSize,
      hasMore: serp.results.length >= pageSize,
      provider: serp.available ? "serpapi" : "unavailable",
      searchedAt: new Date().toISOString(),
      note: serp.results.length
        ? "Visual matches were found from live image-search providers."
        : serp.note || "No visual matches were returned for this image."
    };
  }

  const [serp, bing] = await Promise.all([searchSerpApiByText(query, page, pageSize), searchBingByText(query, page, pageSize)]);
  const results = cleanResults([...serp.results, ...bing.results], pageSize);
  const provider = serp.available && bing.available ? "mixed" : serp.available ? "serpapi" : bing.available ? "bing" : "unavailable";

  return {
    query,
    mode,
    results,
    page,
    pageSize,
    hasMore: results.length >= pageSize,
    provider,
    searchedAt: new Date().toISOString(),
    note: results.length
      ? "Visual results were collected from live image-search providers."
      : "No visual matches were returned. Check provider keys or try a more specific search."
  };
}
