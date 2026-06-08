import { NextResponse } from "next/server";
import { getPrisma, hasSqlDatabase } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSqlDatabase()) {
    return NextResponse.json({ analysisId: null, input: "", type: null, score: null, verdict: null, similarities: [], storageAvailable: false });
  }

  try {
    const { id } = await context.params;
    const prisma = getPrisma();
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { similarities: true }
    });

    if (!analysis) {
      return NextResponse.json({ analysisId: id, input: "", type: null, score: null, verdict: null, similarities: [], storageAvailable: true });
    }

    return NextResponse.json({
      analysisId: analysis.id,
      input: analysis.input,
      type: analysis.inputType,
      score: analysis.trustScore,
      verdict: analysis.verdict,
      similarities: analysis.similarities
    });
  } catch (error) {
    return NextResponse.json({
      analysisId: null,
      input: "",
      type: null,
      score: null,
      verdict: null,
      similarities: [],
      storageAvailable: false,
      error: error instanceof Error ? error.message : "Failed to load similarity data."
    });
  }
}
