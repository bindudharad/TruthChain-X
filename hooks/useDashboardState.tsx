"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import {
  CommunityValidation,
  CopilotAlert,
  CopilotInsight,
  CopilotMessage,
  CopilotSnapshot,
  CopilotSuggestion,
  CreatorProfile,
  TrendingAlert,
  UserTrustInsights,
  VerificationRecord
} from "@/lib/types";

export type AnalyzeResponse = {
  score: number;
  risk: "low" | "medium" | "high";
  credibility: "low" | "medium" | "high";
  consensus: number;
  matches: number;
  confidence: number;
  explanation: string;
  sources: { groq: number; hf: number; gpt: number; gemma?: number };
  txHash: string;
  blockchainStatus: "confirmed" | "queued";
  creator: CreatorProfile;
  record: VerificationRecord;
};

type HistoryResponse = {
  records: VerificationRecord[];
  trendingAlerts: TrendingAlert[];
};

type TrustFeedResponse = {
  feed: Array<{ id: string; label: string; score: number; timestamp: string; status: string; channel: string }>;
};

type CopilotInsightsResponse = {
  insights: CopilotInsight[];
  messages: CopilotMessage[];
  learning: CopilotSnapshot["learning"];
};

type CopilotSuggestionsResponse = {
  suggestions: CopilotSuggestion[];
};

type CopilotAlertsResponse = {
  alerts: CopilotAlert[];
};

type CopilotUserInsightsResponse = {
  userInsights: UserTrustInsights;
};

type DashboardContextValue = {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
  enterpriseMode: boolean;
  setEnterpriseMode: (value: boolean) => void;
  loading: boolean;
  error: string;
  result: AnalyzeResponse;
  records: VerificationRecord[];
  alerts: TrendingAlert[];
  feed: TrustFeedResponse["feed"];
  community: CommunityValidation;
  copilot: CopilotSnapshot;
  verifyContent: (payload: { contentType: "text" | "image"; content: string; fileName: string; demoMode: boolean; creatorId: string; creatorName: string }) => Promise<void>;
  refresh: () => Promise<void>;
  refreshCopilot: (hash?: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function buildStarterCopilot(starter: AnalyzeResponse): CopilotSnapshot {
  return {
    insights: [
      {
        id: "starter-insight",
        title: "Copilot is monitoring the current claim",
        detail: starter.record.executiveSummary,
        severity: starter.score < 40 ? "high" : starter.score < 70 ? "medium" : "low",
        kind: "insight"
      }
    ],
    suggestions: [
      {
        id: "starter-suggestion",
        message: starter.score < 40 ? "Avoid sharing this content until provenance is verified." : "Continue monitoring and request source context if needed.",
        severity: starter.score < 40 ? "high" : "medium",
        recommendation: "Use the trust fingerprint and explanation panel to brief reviewers."
      }
    ],
    alerts: [
      {
        id: "starter-alert",
        title: "Copilot activated",
        detail: "Autonomous trust monitoring is now watching the active result.",
        severity: "low",
        autoDismissMs: 7000
      }
    ],
    messages: [
      {
        id: "starter-message",
        role: "assistant",
        content: "Trust Copilot AI is online and ready to surface proactive guidance."
      }
    ],
    userInsights: {
      trustScore: starter.score,
      exposureLevel: Math.max(18, Math.min(92, starter.record.viralSignal.trendingScore)),
      riskLevel: starter.score < 40 ? "high" : starter.score < 70 ? "medium" : "low",
      behaviorSummary: starter.creator.historySummary
    },
    learning: {
      progress: 64,
      status: "AI learning model is warming up on recent trust activity.",
      updatedAt: new Date().toISOString()
    }
  };
}

export function DashboardStateProvider({
  children,
  starter
}: {
  children: ReactNode;
  starter: AnalyzeResponse;
}) {
  const [demoMode, setDemoMode] = useState(true);
  const [enterpriseMode, setEnterpriseMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse>(starter);
  const [records, setRecords] = useState<VerificationRecord[]>([starter.record]);
  const [alerts, setAlerts] = useState<TrendingAlert[]>([]);
  const [feed, setFeed] = useState<TrustFeedResponse["feed"]>([]);
  const [community, setCommunity] = useState<CommunityValidation>({ upvotes: 2, downvotes: 5, consensusLabel: "Community flags suspicious" });
  const [copilot, setCopilot] = useState<CopilotSnapshot>(() => buildStarterCopilot(starter));

  const fetchHistory = useCallback(async () => {
    const data = await api.get<HistoryResponse>("/api/history");
    setRecords(data.records?.length ? data.records : [starter.record]);
    setAlerts(data.trendingAlerts || []);
  }, [starter.record]);

  const fetchTrustFeed = useCallback(async () => {
    const data = await api.get<TrustFeedResponse>("/api/trust-feed");
    setFeed(data.feed || []);
  }, []);

  const fetchCommunity = useCallback(async (hash: string) => {
    const data = await api.get<CommunityValidation>("/api/community-vote", { params: { hash } });
    setCommunity(data);
  }, []);

  const refreshCopilot = useCallback(async (hash?: string) => {
    const targetHash = hash || result.record.hash;
    const [insightsData, suggestionsData, alertsData, userInsightsData] = await Promise.all([
      api.post<CopilotInsightsResponse>("/api/copilot/insights", { hash: targetHash, demoMode }),
      api.post<CopilotSuggestionsResponse>("/api/copilot/suggestions", { hash: targetHash, demoMode }),
      api.get<CopilotAlertsResponse>("/api/copilot/alerts", { params: { hash: targetHash } }),
      api.get<CopilotUserInsightsResponse>("/api/copilot/user-insights", { params: { hash: targetHash } })
    ]);

    setCopilot({
      insights: insightsData.insights,
      messages: insightsData.messages,
      learning: insightsData.learning,
      suggestions: suggestionsData.suggestions,
      alerts: alertsData.alerts,
      userInsights: userInsightsData.userInsights
    });
  }, [demoMode, result.record.hash]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchHistory(), fetchTrustFeed(), fetchCommunity(result.record.hash), refreshCopilot(result.record.hash)]);
  }, [fetchCommunity, fetchHistory, fetchTrustFeed, refreshCopilot, result.record.hash]);

  const verifyContent = useCallback(async (payload: { contentType: "text" | "image"; content: string; fileName: string; demoMode: boolean; creatorId: string; creatorName: string }) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.post<AnalyzeResponse>("/api/analyze", payload);
      setResult(data);
      setRecords((current) => [data.record, ...current.filter((item) => item.id !== data.record.id)].slice(0, 12));
      await Promise.all([fetchHistory(), fetchTrustFeed(), fetchCommunity(data.record.hash), refreshCopilot(data.record.hash)]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Live analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [fetchCommunity, fetchHistory, fetchTrustFeed, refreshCopilot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshCopilot(result.record.hash).catch(() => undefined);
    }, 18000);

    return () => window.clearInterval(timer);
  }, [refreshCopilot, result.record.hash]);

  const value = useMemo(
    () => ({
      demoMode,
      setDemoMode,
      enterpriseMode,
      setEnterpriseMode,
      loading,
      error,
      result,
      records,
      alerts,
      feed,
      community,
      copilot,
      verifyContent,
      refresh,
      refreshCopilot
    }),
    [alerts, community, copilot, demoMode, enterpriseMode, error, feed, loading, records, refresh, refreshCopilot, result, verifyContent]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardState() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardState must be used inside DashboardStateProvider.");
  }
  return context;
}
