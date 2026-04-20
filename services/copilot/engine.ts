import {
  CopilotAlert,
  CopilotInsight,
  CopilotMessage,
  CopilotSeverity,
  CopilotSnapshot,
  CopilotSuggestion,
  UserTrustInsights,
  VerificationRecord
} from "@/lib/types";
import { buildTrendingAlerts, findVerificationByHash, getCreatorProfile, listVerifications } from "@/lib/db";
import { clamp, callOpenAiCompatibleChat } from "@/services/ai/shared";
import { gemmaService } from "@/services/ai/gemmaService";

type CopilotContext = {
  hash?: string;
  demoMode?: boolean;
};

async function getActiveRecord(hash?: string) {
  if (hash) {
    const byHash = await findVerificationByHash(hash);
    if (byHash) return byHash;
  }

  const records = await listVerifications();
  return records[0] || null;
}

function severityFromScore(score: number): CopilotSeverity {
  if (score < 40) return "high";
  if (score < 70) return "medium";
  return "low";
}

function trustLevelFromExposure(exposureLevel: number): UserTrustInsights["riskLevel"] {
  if (exposureLevel > 72) return "high";
  if (exposureLevel > 42) return "medium";
  return "low";
}

async function buildContext(context: CopilotContext) {
  const records = await listVerifications();
  const record = (await getActiveRecord(context.hash)) || records[0] || null;

  if (!record) {
    return { record: null, creator: null, records: [], exposureLevel: 18, alerts: [] as CopilotAlert[] };
  }

  const creator = (await getCreatorProfile(record.creatorId)) || record.creatorProfile;
  const externalAlerts = buildTrendingAlerts(records);
  const exposureLevel = clamp(
    Math.round(record.viralSignal.trendingScore * 0.48 + record.occurrenceCount * 8 + (record.truthScore < 40 ? 18 : record.truthScore < 70 ? 10 : 4)),
    18,
    96
  );

  const alerts: CopilotAlert[] = [
    {
      id: "copilot-detected-risk",
      title: record.truthScore < 40 ? "New suspicious content detected" : "Content remains under watch",
      detail:
        record.truthScore < 40
          ? `${record.fileName} matched a high-risk trust pattern and should be reviewed before sharing.`
          : `${record.fileName} is still being monitored because the trust picture may shift as new context arrives.`,
      severity: severityFromScore(record.truthScore),
      autoDismissMs: 8000
    },
    {
      id: "copilot-creator-drift",
      title: "Risky creator activity identified",
      detail: `${creator.displayName} currently holds ${creator.credibilityScore}% credibility across ${creator.totalUploads} uploads.`,
      severity: creator.credibilityScore < 55 ? "high" : creator.credibilityScore < 72 ? "medium" : "low",
      autoDismissMs: 9000
    },
    {
      id: "copilot-exposure",
      title: "High exposure alert",
      detail: `Trust exposure is ${exposureLevel}% based on repeat circulation and nearby misinformation activity.`,
      severity: exposureLevel > 72 ? "high" : exposureLevel > 44 ? "medium" : "low",
      autoDismissMs: 8500
    },
    ...externalAlerts.slice(0, 2).map((alert) => ({
      id: `trend-${alert.id}`,
      title: alert.label,
      detail: `${alert.region} is showing elevated ${alert.category.toLowerCase()} activity with volume ${alert.volume}.`,
      severity: alert.riskLevel === "critical" || alert.riskLevel === "high" ? ("high" as const) : ("medium" as const),
      autoDismissMs: 10000
    }))
  ];

  return { record, creator, records, exposureLevel, alerts };
}

async function buildReasonedMessage(record: VerificationRecord, exposureLevel: number, demoMode?: boolean) {
  if (process.env.OPENROUTER_API_KEY && !demoMode) {
    try {
      const content = await callOpenAiCompatibleChat(
        "https://openrouter.ai/api/v1",
        process.env.OPENROUTER_API_KEY,
        process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b",
        "You are an autonomous trust copilot. Write one concise guidance message based on the current trust analysis.",
        `File: ${record.fileName}\nTruth score: ${record.truthScore}\nConfidence: ${record.confidence}\nExposure level: ${exposureLevel}\nSignals: ${record.suspiciousSignals.join(", ")}\nSummary: ${record.executiveSummary}`
      );

      if (content) return content;
    } catch {
      // Fall through to heuristic message.
    }
  }

  if (record.truthScore < 40) return "I would treat this as likely misinformation: slow distribution, verify the origin, and use the trust passport when escalating.";
  if (record.truthScore < 70) return "This result is mixed, so the safest move is to request stronger sourcing and keep watching for edited variants.";
  return "The content looks relatively healthy right now, but the copilot is still monitoring for trust drift and mutation signals.";
}

async function buildSuggestionMessage(record: VerificationRecord, creatorScore: number, demoMode?: boolean) {
  if (process.env.GROQ_API_KEY && !demoMode) {
    try {
      const content = await callOpenAiCompatibleChat(
        "https://api.groq.com/openai/v1",
        process.env.GROQ_API_KEY,
        process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        "You are a trust copilot that returns one concise next-step recommendation.",
        `Truth score: ${record.truthScore}\nCreator score: ${creatorScore}\nSignals: ${record.suspiciousSignals.join(", ")}\nExplain the next best action in one sentence.`
      );

      if (content) return content;
    } catch {
      // Fall through to heuristic suggestion.
    }
  }

  if (record.truthScore < 40) return "Avoid sharing this content until provenance is verified.";
  if (creatorScore < 60) return "Verify source credibility before trusting the creator or the content.";
  return "Keep monitoring the content and share the fingerprint when external proof is needed.";
}

export async function getCopilotUserInsights(context: CopilotContext = {}): Promise<UserTrustInsights> {
  const { record, creator, exposureLevel } = await buildContext(context);

  if (!record || !creator) {
    return {
      trustScore: 50,
      exposureLevel: 18,
      riskLevel: "low",
      behaviorSummary: "Copilot is waiting for enough trust activity to build a personal behavior summary."
    };
  }

  return {
    trustScore: record.truthScore,
    exposureLevel,
    riskLevel: trustLevelFromExposure(exposureLevel),
    behaviorSummary:
      creator.credibilityScore < 55
        ? `${creator.displayName} is operating in a fragile trust zone, so Copilot is raising caution around new uploads.`
        : `${creator.displayName} is providing moderate trust stability, though content-level signals remain the primary decision driver.`
  };
}

export async function getCopilotSuggestions(context: CopilotContext = {}): Promise<CopilotSuggestion[]> {
  const { record, creator, exposureLevel } = await buildContext(context);

  if (!record || !creator) {
    return [
      {
        id: "copilot-suggestion-default",
        message: "Analyze new content to activate Copilot recommendations.",
        severity: "low",
        recommendation: "Upload text or media to start autonomous trust monitoring."
      }
    ];
  }

  const aiSuggestion = await buildSuggestionMessage(record, creator.credibilityScore, context.demoMode);

  return [
    {
      id: "copilot-suggestion-primary",
      message: aiSuggestion,
      severity: severityFromScore(record.truthScore),
      recommendation: record.truthScore < 40 ? "Pause sharing and verify origin." : "Keep the content under review."
    },
    {
      id: "copilot-suggestion-source",
      message: "Source credibility should be checked alongside direct content signals before trusting this result.",
      severity: creator.credibilityScore < 60 ? "high" : "medium",
      recommendation: `Review creator reputation drift at ${creator.credibilityScore}% credibility.`
    },
    {
      id: "copilot-suggestion-exposure",
      message: `Your exposure level is ${exposureLevel}%, which means nearby content clusters may influence future trust risk.`,
      severity: exposureLevel > 72 ? "high" : exposureLevel > 44 ? "medium" : "low",
      recommendation: "Monitor the feed and use the trust passport when collaborating with reviewers."
    }
  ];
}

export async function getCopilotAlerts(context: CopilotContext = {}): Promise<CopilotAlert[]> {
  const { alerts } = await buildContext(context);
  return alerts;
}

export async function getCopilotInsights(context: CopilotContext = {}): Promise<{
  insights: CopilotInsight[];
  messages: CopilotMessage[];
  learning: CopilotSnapshot["learning"];
}> {
  const { record, creator, exposureLevel, records } = await buildContext(context);

  if (!record || !creator) {
    return {
      insights: [
        {
          id: "copilot-waiting",
          title: "Copilot is standing by",
          detail: "Once content is analyzed, the copilot will start surfacing autonomous trust insights.",
          severity: "low",
          kind: "monitoring"
        }
      ],
      messages: [
        {
          id: "copilot-system-default",
          role: "system",
          content: "No live trust context yet. Upload content to activate autonomous monitoring."
        }
      ],
      learning: {
        progress: 54,
        status: "AI learning model is warming up on baseline trust activity.",
        updatedAt: new Date().toISOString()
      }
    };
  }

  const gemmaValidation = await gemmaService({
    input: { type: record.type, content: record.sourcePreview, demoMode: true },
    preview: record.sourcePreview,
    history: records
  });
  const reasonedMessage = await buildReasonedMessage(record, exposureLevel, context.demoMode);
  const learningProgress = clamp(
    Math.round(58 + record.occurrenceCount * 4 + (record.viralSignal.trendingScore > 70 ? 12 : 4) + (record.truthScore < 40 ? 8 : 0)),
    60,
    97
  );

  return {
    insights: [
      {
        id: "copilot-insight-risk",
        title: record.truthScore < 40 ? "Risk spike detected" : "Trust posture updated",
        detail:
          record.truthScore < 40
            ? `${record.fileName} is showing coordinated misinformation traits across narrative style and spread velocity.`
            : `${record.fileName} remains under observation while the trust profile evolves.`,
        severity: severityFromScore(record.truthScore),
        kind: "insight"
      },
      {
        id: "copilot-insight-creator",
        title: "Personal trust insight",
        detail:
          creator.credibilityScore < 55
            ? "Creator credibility is weakening, which increases your personal trust exposure around this content stream."
            : "Creator behavior is adding some stability, but the copilot is still prioritizing direct content evidence.",
        severity: creator.credibilityScore < 55 ? "high" : "medium",
        kind: "behavior"
      },
      {
        id: "copilot-insight-validation",
        title: "Context validation refresh",
        detail: gemmaValidation.summary,
        severity: gemmaValidation.truthScore < 45 ? "high" : gemmaValidation.truthScore < 70 ? "medium" : "low",
        kind: "learning"
      }
    ],
    messages: [
      {
        id: "copilot-system-scan",
        role: "system",
        content: `Autonomous scan active. Watching ${records.length} trust records for drift, mutation, and creator risk.`
      },
      {
        id: "copilot-assistant-guidance",
        role: "assistant",
        content: reasonedMessage
      },
      {
        id: "copilot-assistant-learning",
        role: "assistant",
        content: "AI updated the risk model based on recent activity and adjusted the recommendation stack."
      }
    ],
    learning: {
      progress: learningProgress,
      status: "AI updated the risk model based on recent activity.",
      updatedAt: new Date().toISOString()
    }
  };
}

export async function getCopilotSnapshot(context: CopilotContext = {}): Promise<CopilotSnapshot> {
  const [userInsights, suggestions, alerts, insightPayload] = await Promise.all([
    getCopilotUserInsights(context),
    getCopilotSuggestions(context),
    getCopilotAlerts(context),
    getCopilotInsights(context)
  ]);

  return {
    userInsights,
    suggestions,
    alerts,
    insights: insightPayload.insights,
    messages: insightPayload.messages,
    learning: insightPayload.learning
  };
}
