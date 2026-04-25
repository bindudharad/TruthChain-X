import { NextResponse } from "next/server";
import { buildDashboardSnapshot } from "@/server/services/dashboard/summary";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/Scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash") || undefined;
  console.log("Fetching dashboard data");
  try {
    await connectDB();
    const scans = await Scan.find().sort({ createdAt: -1 }).limit(50).lean();

    if (scans.length) {
      const totalAlerts = scans.filter((scan) => scan.category !== "Safe").length;
      const averageScore = Math.round(scans.reduce((sum, scan) => sum + scan.score, 0) / Math.max(scans.length, 1));
      const lastVerdict = scans[0]?.category || "No data";

      return NextResponse.json({
        totalAlerts,
        recentScans: scans.length,
        averageScore,
        lastVerdict,
        alerts: totalAlerts,
        recentScanItems: scans.slice(0, 10).map((scan) => ({
          input: scan.input,
          inputType: scan.inputType || "text",
          score: scan.score,
          result: scan.category,
          timestamp: scan.createdAt,
          transactionHash: scan.transactionHash || "",
          blockchainStatus: scan.blockchainStatus || "queued"
        })),
        verificationStats: {
          verified: scans.filter((scan) => scan.claimStatus === "Verified").length,
          unverified: scans.filter((scan) => scan.claimStatus === "Unverified").length,
          misleading: scans.filter((scan) => scan.claimStatus === "False").length,
          liveChecked: scans.filter((scan) => Array.isArray(scan.sources) && scan.sources.length > 0).length
        }
      });
    }
  } catch {
    // Fall back to the existing dashboard snapshot path if Mongo is unavailable.
  }

  const snapshot = await buildDashboardSnapshot(hash);

  if (!snapshot) {
    return NextResponse.json({ error: "No dashboard records found." }, { status: 404 });
  }

  return NextResponse.json(snapshot.stats);
}
