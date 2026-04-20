import { NextResponse } from "next/server";
import { getCommunityValidation, voteOnContent } from "@/lib/community";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ hash?: string; direction?: "up" | "down" }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.hash || !body.direction) {
    return NextResponse.json({ error: "Missing vote payload." }, { status: 400 });
  }

  const votes = voteOnContent(body.hash, body.direction);
  return NextResponse.json(votes);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "Missing hash." }, { status: 400 });
  }

  return NextResponse.json(getCommunityValidation(hash));
}
