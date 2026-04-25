import { FactCheckArticle } from "@/lib/types";

function env(name: string) {
  const aliases: Record<string, string[]> = {
    SERPAPI_KEY: ["SERPAPI_KEY", "SERP_API_KEY"]
  };
  const value = (aliases[name] || [name]).map((key) => process.env[key]).find(Boolean);
  return value && !/^(change-me|your_|your-|example|placeholder)/i.test(value) ? value : "";
}

async function safeJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function verifyClaim(claim: string): Promise<{ totalSources: number; articles: FactCheckArticle[] }> {
  if (!claim.trim()) {
    return { totalSources: 0, articles: [] };
  }

  try {
    const requests: Array<Promise<Response | null>> = [];
    const gnewsKey = env("GNEWS_API_KEY");
    const newsApiKey = env("NEWS_API_KEY");
    const serperKey = env("SERPER_API_KEY");
    const serpApiKey = env("SERPAPI_KEY");

    console.log("FACT CHECK INPUT:", claim);
    console.log("FACT CHECK ENV:", {
      gnews: gnewsKey ? "OK" : "MISSING",
      newsApi: newsApiKey ? "OK" : "MISSING",
      serper: serperKey ? "OK" : "MISSING",
      serpapi: serpApiKey ? "OK" : "MISSING"
    });

    if (gnewsKey) {
      requests.push(
        fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(claim)}&lang=en&max=5&token=${gnewsKey}`, {
          next: { revalidate: 600 }
        }).catch(() => null)
      );
    }

    if (newsApiKey) {
      requests.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(claim)}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${newsApiKey}`, {
          next: { revalidate: 600 }
        }).catch(() => null)
      );
    }

    if (serperKey) {
      requests.push(
        fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ q: claim, num: 5 }),
          next: { revalidate: 600 }
        }).catch(() => null)
      );
    }

    if (!serperKey && serpApiKey) {
      requests.push(
        fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(claim)}&api_key=${encodeURIComponent(serpApiKey)}&num=5`, {
          next: { revalidate: 600 }
        }).catch(() => null)
      );
    }

    if (!requests.length) {
      throw new Error("Real-time verification is not configured. Add NEWS_API_KEY, GNEWS_API_KEY, SERPER_API_KEY, or SERPAPI_KEY.");
    }

    const responses = await Promise.all(requests);
    const payloads = await Promise.all(
      responses.map(async (response) => {
        if (!response) return null;
        return safeJson<Record<string, unknown>>(response);
      })
    );

    const articles: FactCheckArticle[] = [];

    for (const payload of payloads) {
      if (!payload) continue;

      const gnewsArticles = Array.isArray(payload.articles) ? payload.articles : [];
      for (const article of gnewsArticles) {
        const next = article as {
          title?: string;
          description?: string;
          url?: string;
          publishedAt?: string;
          source?: { name?: string };
        };
        if (!next.title || !next.url) continue;
        articles.push({
          title: next.title,
          description: next.description,
          url: next.url,
          source: next.source?.name || "GNews",
          publishedAt: next.publishedAt,
          sourceType: payload.totalArticles !== undefined ? "gnews" : "newsapi"
        });
      }

      const serperOrganic = Array.isArray(payload.organic) ? payload.organic : [];
      for (const article of serperOrganic) {
        const next = article as {
          title?: string;
          snippet?: string;
          link?: string;
        };
        if (!next.title || !next.link) continue;
        articles.push({
          title: next.title,
          description: next.snippet,
          url: next.link,
          source: "Google Search",
          sourceType: "serper"
        });
      }

      const serpApiOrganic = Array.isArray(payload.organic_results) ? payload.organic_results : [];
      for (const article of serpApiOrganic) {
        const next = article as {
          title?: string;
          snippet?: string;
          link?: string;
        };
        if (!next.title || !next.link) continue;
        articles.push({
          title: next.title,
          description: next.snippet,
          url: next.link,
          source: "SerpAPI",
          sourceType: "serper"
        });
      }
    }

    const deduped = articles.filter(
      (article, index, list) => list.findIndex((candidate) => candidate.url === article.url || candidate.title === article.title) === index
    );

    return {
      totalSources: deduped.length,
      articles: deduped.slice(0, 10)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Real-time verification failed.";
    console.error("FACT CHECK ERROR:", message);
    throw new Error(message);
  }
}
