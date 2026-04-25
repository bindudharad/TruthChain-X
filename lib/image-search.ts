import { ReverseImageMatch, ReverseImageSearchResponse } from "@/lib/types";

const TRUSTED_SOURCES = ["bbc", "reuters", "apnews", "thehindu", "nytimes", "wikipedia", ".gov", ".edu", "youtube", "amazon"];
const SUSPICIOUS_PATTERNS = /(fake|scam|rumou?r|deepfake|clickbait|leak|hoax|misleading|nsfw|adult)/i;
const LOW_REPUTATION_TLDS = /\.(xyz|top|click|buzz|monster|work|gq|tk)(\/|$)/i;

function buildSourceLabel(link: string, source?: string) {
  if (source?.trim()) return source.trim();

  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown source";
  }
}

function scoreMatch(match: { title?: string; snippet?: string; link?: string; source?: string }) {
  const haystack = `${match.title || ""} ${match.snippet || ""} ${match.source || ""} ${match.link || ""}`.toLowerCase();
  let trustScore = 70;

  if (TRUSTED_SOURCES.some((item) => haystack.includes(item))) trustScore += 18;
  if (LOW_REPUTATION_TLDS.test(match.link || "")) trustScore -= 22;
  if (SUSPICIOUS_PATTERNS.test(haystack)) trustScore -= 26;

  return Math.max(8, Math.min(98, trustScore));
}

function summarizeMatch(match: { source: string; suspicious: boolean; trustScore: number }) {
  if (match.suspicious) {
    return `${match.source} contains a visual match, but the surrounding context carries risky or misleading signals.`;
  }

  if (match.trustScore >= 80) {
    return `${match.source} appears to be a strong visual match from a more credible source.`;
  }

  return `${match.source} contains a related visual match that should be checked against the original context.`;
}

export async function uploadImageToCloudinary(imageData: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Reverse image search needs a public image URL. Add one manually or configure Cloudinary upload.");
  }

  const body = new FormData();
  body.append("file", imageData);
  body.append("upload_preset", uploadPreset);
  body.append("folder", "truthchain-x/reverse-search");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body
  });

  const payload = (await response.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary upload failed.");
  }

  return payload.secure_url;
}

export async function runImageSearch(input: { imageUrl?: string; imageData?: string }): Promise<ReverseImageSearchResponse> {
  let publicImageUrl = typeof input.imageUrl === "string" && /^https?:\/\//i.test(input.imageUrl) ? input.imageUrl : "";

  if (!publicImageUrl && input.imageData) {
    publicImageUrl = await uploadImageToCloudinary(input.imageData);
  }

  if (!publicImageUrl) {
    throw new Error("Reverse image search needs a public image URL. Upload via Cloudinary or provide the original public image link.");
  }

  if (!process.env.SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY is not configured.");
  }

  const searchUrl = new URL("https://serpapi.com/search.json");
  searchUrl.searchParams.set("engine", "google_lens");
  searchUrl.searchParams.set("url", publicImageUrl);
  searchUrl.searchParams.set("type", "visual_matches");
  searchUrl.searchParams.set("api_key", process.env.SERPAPI_KEY);
  searchUrl.searchParams.set("hl", "en");
  searchUrl.searchParams.set("country", "us");
  searchUrl.searchParams.set("no_cache", "true");

  const response = await fetch(searchUrl.toString(), { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    visual_matches?: Array<{
      thumbnail?: string;
      title?: string;
      link?: string;
      source?: string;
    }>;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Image search failed.");
  }

  const results: ReverseImageMatch[] = (payload.visual_matches || [])
    .filter((item) => item.link && item.title)
    .slice(0, 12)
    .map((item) => {
      const source = buildSourceLabel(item.link || "", item.source);
      const trustScore = scoreMatch({ title: item.title, link: item.link, source });
      const suspicious = trustScore < 45;

      return {
        thumbnail: item.thumbnail || publicImageUrl,
        title: item.title || "Untitled result",
        link: item.link || "#",
        source,
        aiSummary: summarizeMatch({ source, suspicious, trustScore }),
        trustScore,
        suspicious
      };
    });

  return {
    imageUrl: publicImageUrl,
    results,
    searchedAt: new Date().toISOString(),
    searchedWith: "serpapi",
    note: results.length
      ? "Visual matches were collected from Google Lens visual matches via SerpAPI."
      : "No strong public visual matches were returned for this image."
  };
}
