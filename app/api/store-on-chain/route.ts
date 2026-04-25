import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { storeOnChain } from "@/lib/blockchain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      input?: string;
      hash?: string;
      score?: number;
      verdict?: string;
      userAddress?: string;
    };

    const score = Number(body.score ?? 0);
    const verdict = body.verdict || (score < 40 ? "Risk" : score < 70 ? "Suspicious" : "Safe");
    const hash =
      body.hash ||
      (body.input
        ? createHash("sha256")
            .update(body.input)
            .digest("hex")
        : "");

    if (!hash) {
      return NextResponse.json({ error: "Provide input or hash." }, { status: 400 });
    }

    const chainResult = await storeOnChain(hash, score, Math.floor(Date.now() / 1000), verdict, body.userAddress);

    return NextResponse.json({
      success: true,
      hash,
      score,
      verdict,
      blockchain: chainResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to store on chain." },
      { status: 500 }
    );
  }
}
