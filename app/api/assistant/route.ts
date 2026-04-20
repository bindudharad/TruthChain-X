import { NextResponse } from "next/server";
import { findVerificationByHash } from "@/lib/db";
import { callOpenAiCompatibleChat } from "@/services/ai/shared";
import { readJsonBody } from "@/server/utils/read-json";

export async function POST(request: Request) {
  const parsed = await readJsonBody<{ hash?: string; question?: string; score?: number; explanation?: string; creatorName?: string; risk?: string }>(request);
  if (parsed.error) return parsed.error;

  const body = parsed.data!;
  if (!body.question) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }

  const record = body.hash ? await findVerificationByHash(body.hash) : null;
  const score = record?.truthScore ?? body.score ?? 50;
  const explanation = record?.explanation ?? body.explanation ?? "";
  const creatorName = record?.creatorProfile.displayName ?? body.creatorName ?? "the creator";
  const risk = record?.trustFingerprint.manipulationRisk ?? body.risk ?? "medium";

  let answer = "";

  if (process.env.OPENROUTER_API_KEY) {
    try {
      answer = await callOpenAiCompatibleChat(
        "https://openrouter.ai/api/v1",
        process.env.OPENROUTER_API_KEY,
        process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b",
        "You answer trust-analysis questions in plain language. Be concise, practical, and context-aware.",
        `Question: ${body.question}\nTrust score: ${score}\nRisk: ${risk}\nCreator: ${creatorName}\nExplanation: ${explanation}`
      );
    } catch {
      answer = "";
    }
  }

  if (!answer) {
    const q = body.question.toLowerCase();
    if (q.includes("why")) answer = `This looks risky because ${explanation.toLowerCase()}`;
    else if (q.includes("simple")) answer = score < 40 ? "In simple terms: the system thinks this is probably misleading or manipulated." : "In simple terms: this content does not look strongly suspicious right now.";
    else if (q.includes("risk")) answer = `The current risk level is ${risk}. That reflects manipulation clues, source credibility, and model agreement.`;
    else if (q.includes("creator")) answer = `${creatorName} is part of the trust picture because creator credibility changes how cautiously this result should be interpreted.`;
    else answer = score < 40 ? "The safest interpretation is that this content should be independently verified before sharing." : "The system does not see a severe risk signal, but provenance still matters.";
  }

  return NextResponse.json({ answer });
}
