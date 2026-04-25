import { NextResponse } from "next/server";
import { hashContent } from "@/lib/hashing";
import { AnalysisInput } from "@/lib/types";
import { findVerificationByHash } from "@/lib/db";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { readJsonBody } from "@/server/utils/read-json";

function getSerperKey() {
  const value = process.env.SERPER_API_KEY || process.env.SERPAPI_KEY;
  if (!value || /^(change-me|your_|your-|example|placeholder)/i.test(value)) {
    throw new Error("SERPER_API_KEY or SERPAPI_KEY not configured");
  }
  return value;
}

async function searchRealtime(input: string, apiKey: string) {
  if (process.env.SERPER_API_KEY) {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: input, num: 5 })
    });

    if (!response.ok) {
      throw new Error(`Serper verification failed with status ${response.status}`);
    }

    return (await response.json()) as { organic?: Array<Record<string, unknown>> };
  }

  const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(input)}&api_key=${encodeURIComponent(apiKey)}&num=5`);
  if (!response.ok) {
    throw new Error(`SerpAPI verification failed with status ${response.status}`);
  }

  const data = (await response.json()) as { organic_results?: Array<Record<string, unknown>> };
  return { organic: data.organic_results || [] };
}

export async function handleVerifyGet(request: Request) {
  const limited = applyRouteRateLimit(request, "verify-get", 90);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const type = searchParams.get("type");
  const content = searchParams.get("content");
  const resolvedHash = hash || (type && content ? hashContent(`${type}:${content}`) : "");

  if (!resolvedHash) {
    return NextResponse.json({ error: "Provide either hash or type + content." }, { status: 400 });
  }

  const record = await findVerificationByHash(resolvedHash);
  return NextResponse.json({ hash: resolvedHash, verified: Boolean(record), record });
}

export async function handleVerifyPost(request: Request) {
  try {
    const limited = applyRouteRateLimit(request, "verify-post", 90);
    if (limited) return limited;

    const parsed = await readJsonBody<Pick<AnalysisInput, "type" | "content"> & { input?: string }>(request);
    if (parsed.error) return parsed.error;

    const body = parsed.data;
    const input = body?.input?.trim() || body?.content?.trim() || "";
    const type = body?.type || "text";

    if (!input) {
      return NextResponse.json({ success: false, error: "Missing verification payload." }, { status: 400 });
    }

    const serperKey = getSerperKey();
    const hash = hashContent(`${type}:${input}`);
    const record = await findVerificationByHash(hash);

    console.log("VERIFY INPUT:", input);
    console.log("VERIFY ENV:", serperKey ? "OK" : "MISSING");

    const data = await searchRealtime(input, serperKey);
    console.log("API RESPONSE:", data);

    return NextResponse.json({
      success: true,
      hash,
      verified: Boolean(record),
      record,
      sources: data.organic || [],
      totalSources: data.organic?.length || 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    console.error("VERIFY ERROR:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
