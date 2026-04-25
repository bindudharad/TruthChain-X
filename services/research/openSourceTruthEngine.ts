import { AnalysisInput, ClaimVerificationSummary, OpenSourceSignal, VerificationRecord } from "@/lib/types";

function containsAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function collectOpenSourceSignals(
  input: AnalysisInput,
  history: VerificationRecord[],
  verification?: ClaimVerificationSummary | null
): Promise<OpenSourceSignal[]> {
  const text = input.content.toLowerCase();
  const medicalClaim = containsAny(text, [/cure/i, /virus/i, /treatment/i, /medicine/i, /health/i]);
  const politicalClaim = containsAny(text, [/election/i, /government/i, /speech/i, /campaign/i, /policy/i]);
  const financialClaim = containsAny(text, [/profit/i, /stock/i, /investment/i, /crypto/i, /market/i]);
  const repeatedHistory = history.filter((record) => record.sourcePreview.toLowerCase().includes(text.slice(0, 24))).length;

  const signals: OpenSourceSignal[] = [
    {
      id: "news-wire-check",
      kind: "news",
      title: "Trusted newsroom mismatch",
      summary:
        medicalClaim || politicalClaim || financialClaim
          ? "No matching coverage was found across simulated trusted newsroom feeds for the core claim wording."
          : "Simulated newsroom sampling found partial overlap, but not enough corroboration to fully support the claim.",
      score: medicalClaim || politicalClaim || financialClaim ? 28 : 54,
      confidence: 74,
      stance: medicalClaim || politicalClaim || financialClaim ? "challenges" : "mixed",
      source: "Open newsroom feeds",
      url: "https://example.com/open-news-signals"
    },
    {
      id: "dataset-watch",
      kind: "dataset",
      title: "Public misinformation dataset overlap",
      summary:
        repeatedHistory > 0
          ? `The narrative overlaps with ${repeatedHistory} previously indexed items in the local misinformation history.`
          : "The narrative shape partially resembles entries commonly seen in public misinformation benchmark datasets.",
      score: repeatedHistory > 0 ? 24 : 43,
      confidence: 79,
      stance: "challenges",
      source: "Benchmark trust datasets",
      url: "https://example.com/public-trust-datasets"
    },
    {
      id: "community-signal",
      kind: "community",
      title: "Community trust signal",
      summary:
        repeatedHistory > 1
          ? "Community-style reporting pressure is elevated because similar versions have already been challenged."
          : "Community sentiment is mixed, which suggests reviewers should keep the item under watch rather than trusting it immediately.",
      score: repeatedHistory > 1 ? 31 : 58,
      confidence: 71,
      stance: repeatedHistory > 1 ? "challenges" : "mixed",
      source: "Community moderation signals",
      url: "https://example.com/community-signals"
    }
  ];

  if (input.type === "image") {
    signals.push({
      id: "visual-dataset",
      kind: "dataset",
      title: "Visual manipulation benchmark overlap",
      summary: "Simulated visual benchmark lookup found artifact patterns that resemble edited or synthetic media examples.",
      score: clamp(34 - repeatedHistory * 3, 18, 42),
      confidence: 76,
      stance: "challenges",
      source: "Open visual forensics datasets",
      url: "https://example.com/visual-forensics"
    });
  }

  if (verification?.claimDetected) {
    signals.unshift({
      id: "claim-verification",
      kind: "news",
      title: verification.noTrustedSource ? "No trusted source found" : "Trusted reporting available",
      summary: verification.noTrustedSource
        ? "The claim requires verification, but trusted coverage could not be matched from the available verification layer."
        : `Trusted reporting or reference coverage was found for the claim via ${verification.trustedSources
            .slice(0, 2)
            .map((source) => source.source)
            .join(", ")}.`,
      score: verification.noTrustedSource ? 18 : 82,
      confidence: verification.confidence,
      stance: verification.noTrustedSource ? "challenges" : "supports",
      source: verification.checkedLive ? "Live source verification" : "Hybrid knowledge verification",
      url: verification.trustedSources[0]?.url || "https://example.com/verification"
    });
  }

  return signals;
}
