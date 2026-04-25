import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";
import { getExplorerUrl, verifyHashOnChain } from "@/lib/blockchain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash") || "";

    if (!hash) {
      return NextResponse.json({ error: "Hash is required." }, { status: 400 });
    }

    const [record, chain] = await Promise.all([findVerificationByHash(hash), verifyHashOnChain(hash)]);
    const txHash = record?.transactionHash || "";

    return NextResponse.json({
      hash,
      foundInDatabase: Boolean(record),
      foundOnChain: Boolean(chain?.found),
      matches:
        Boolean(record) &&
        Boolean(chain?.found) &&
        Number(chain?.trustScore ?? -1) === Number(record?.truthScore ?? -2),
      database: record
        ? {
            fileName: record.fileName,
            score: record.truthScore,
            verdict: record.unified?.category || "",
            timestamp: record.timestamp,
            transactionHash: record.transactionHash
          }
        : null,
      blockchain: chain
        ? {
            trustScore: chain.trustScore,
            verdict: chain.verdict,
            timestamp: chain.timestamp,
            user: chain.user,
            explorerUrl: txHash ? getExplorerUrl(txHash) : null
          }
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: 500 }
    );
  }
}
