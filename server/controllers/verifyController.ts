import { NextResponse } from "next/server";
import { hashContent } from "@/lib/hashing";
import { AnalysisInput } from "@/lib/types";
import { findVerificationByHash } from "@/lib/db";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { readJsonBody } from "@/server/utils/read-json";

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
  const limited = applyRouteRateLimit(request, "verify-post", 90);
  if (limited) return limited;

  const parsed = await readJsonBody<Pick<AnalysisInput, "type" | "content">>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data;
  if (!body?.type || !body?.content) {
    return NextResponse.json({ error: "Missing verification payload." }, { status: 400 });
  }

  const hash = hashContent(`${body.type}:${body.content}`);
  const record = await findVerificationByHash(hash);
  return NextResponse.json({ hash, verified: Boolean(record), record });
}
