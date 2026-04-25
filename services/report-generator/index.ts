import { SimilarityMatch, UnifiedReportDraft } from "@/lib/types";

function inferReason(match: SimilarityMatch) {
  if (match.similarityScore >= 85) return "Likely duplicate misinformation";
  if (match.similarityScore >= 65) return "Likely modified misinformation variant";
  return "Potentially misleading related content";
}

function suspiciousParts(match: SimilarityMatch) {
  const parts = [match.caption, match.preview]
    .join(" ")
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  return parts.length ? parts : ["Repeated narrative pattern detected across indexed content."];
}

export async function generateModerationReport(match: SimilarityMatch): Promise<UnifiedReportDraft> {
  const reason = inferReason(match);
  const suspicious = suspiciousParts(match);
  const explanation =
    match.similarityScore >= 85
      ? `This item strongly overlaps with previously flagged content and carries a low trust score, which makes it appropriate for escalation.`
      : match.similarityScore >= 65
        ? `This item appears to be a modified version of previously indexed suspicious content. The language and structure changed, but the core narrative still matches known high-risk patterns.`
        : `This item is related to a suspicious narrative cluster and is worth human review before further spread.`;

  return {
    contentId: match.matchId,
    reason,
    similarityScore: match.similarityScore,
    trustScore: match.trustScore,
    explanation,
    suspiciousParts: suspicious
  };
}
