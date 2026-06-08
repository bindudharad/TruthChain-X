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
  GlobalIntelligenceSnapshot,
  IntelligenceAlert,
  IntelligenceFeedItem,
  IntelligenceLineageStep,
  IntelligenceNetworkEdge,
  IntelligenceNetworkNode,
  IntelligencePrediction,
  IntelligenceRegion,
  TrendingAlert,
  UserTrustInsights,
  VerificationRecord,
  SimilarityMatch,
  PhishingRiskLevel,
  AIDetectionSummary,
  MediaAnalysisSummary,
  SensitiveContentSummary,
  UnifiedTrustResult,
  SpamCategory,
  SpamColor,
  SpamFeatures,
  SimpleSpamOutput,
  ClaimVerificationSummary,
  DashboardAnalyzeResponse,
  DashboardFeedItem,
  DashboardSnapshot,
  DashboardStorageInfo,
  DashboardStats
} from "@/lib/types";

export type AnalyzeResponse = DashboardAnalyzeResponse;

const LAST_ANALYSIS_STORAGE_KEY = "truthchain:lastAnalysis";

type StoredAnalysisCache = {
  requestKey: string;
  result: AnalyzeResponse;
  savedAt: string;
};

type HistoryResponse = {
  records: VerificationRecord[];
  trendingAlerts: TrendingAlert[];
};

type TrustFeedResponse = {
  feed: DashboardFeedItem[];
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

type IntelligenceGlobalResponse = {
  riskIndex: GlobalIntelligenceSnapshot["riskIndex"];
  regions: IntelligenceRegion[];
};

type IntelligenceNetworkResponse = {
  nodes: IntelligenceNetworkNode[];
  edges: IntelligenceNetworkEdge[];
};

type IntelligenceLineageResponse = {
  lineage: IntelligenceLineageStep[];
  crossPlatform: GlobalIntelligenceSnapshot["crossPlatform"];
};

type IntelligenceFeedResponse = {
  feed: IntelligenceFeedItem[];
  alerts: IntelligenceAlert[];
};

type IntelligencePredictionResponse = {
  prediction: IntelligencePrediction;
};

export type DashboardContextValue = {
  enterpriseMode: boolean;
  setEnterpriseMode: (value: boolean) => void;
  loading: boolean;
  error: string;
  result: AnalyzeResponse | null;
  records: VerificationRecord[];
  alerts: TrendingAlert[];
  feed: TrustFeedResponse["feed"];
  generatedAt: string;
  storage: DashboardStorageInfo;
  stats: DashboardStats;
  community: CommunityValidation;
  copilot: CopilotSnapshot;
  intelligence: GlobalIntelligenceSnapshot;
  verifyContent: (payload: {
    contentType: "text" | "image" | "video";
    content: string;
    url?: string;
    imageUrl?: string;
    videoUrl?: string;
    fileName: string;
    creatorId: string;
    creatorName: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  refreshCopilot: (hash?: string) => Promise<void>;
  refreshIntelligence: (hash?: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);
function buildEmptyCopilot(): CopilotSnapshot {
  return {
    insights: [],
    suggestions: [],
    alerts: [],
    messages: [],
    userInsights: {
      trustScore: 0,
      exposureLevel: 0,
      riskLevel: "low",
      behaviorSummary: "No verified activity is loaded yet."
    },
    learning: {
      progress: 0,
      status: "Feature not connected to backend yet.",
      updatedAt: ""
    }
  };
}

function buildEmptyIntelligence(): GlobalIntelligenceSnapshot {
  return {
    riskIndex: {
      globalRiskScore: 0,
      topRiskRegions: [],
      trendingFakeTopics: [],
      highRiskCreators: [],
      riskTrend: [],
      distribution: []
    },
    regions: [],
    network: {
      nodes: [],
      edges: []
    },
    lineage: [],
    feed: [],
    alerts: [],
    prediction: {
      label: "No prediction available until a verification record exists.",
      score: 0,
      confidence: 0,
      rationale: "Feature not connected to backend."
    },
    crossPlatform: []
  };
}

function buildStarterStorage(): DashboardStorageInfo {
  return {
    mode: "local-json",
    hasMongoUri: false,
    usingMongo: false
  };
}

export function DashboardStateProvider({
  children,
  initialSnapshot
}: {
  children: ReactNode;
  initialSnapshot?: DashboardSnapshot | null;
}) {
  const [enterpriseMode, setEnterpriseMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(initialSnapshot?.result ?? null);
  const [records, setRecords] = useState<VerificationRecord[]>(initialSnapshot?.records ?? []);
  const [alerts, setAlerts] = useState<TrendingAlert[]>(initialSnapshot?.alerts ?? []);
  const [feed, setFeed] = useState<TrustFeedResponse["feed"]>(initialSnapshot?.feed ?? []);
  const [generatedAt, setGeneratedAt] = useState(initialSnapshot?.generatedAt ?? "");
  const [storage, setStorage] = useState<DashboardStorageInfo>(initialSnapshot?.storage ?? buildStarterStorage());
  const [stats, setStats] = useState<DashboardStats>(
    initialSnapshot?.stats ?? {
      totalAlerts: 0,
      recentScans: 0,
      averageScore: 0,
      lastVerdict: "No data",
      verificationStats: { verified: 0, unverified: 0, misleading: 0, liveChecked: 0 }
    }
  );
  const [community, setCommunity] = useState<CommunityValidation>(initialSnapshot?.community ?? { upvotes: 0, downvotes: 0, consensusLabel: "No community signal yet" });
  const [copilot, setCopilot] = useState<CopilotSnapshot>(initialSnapshot?.copilot ?? buildEmptyCopilot());
  const [intelligence, setIntelligence] = useState<GlobalIntelligenceSnapshot>(initialSnapshot?.intelligence ?? buildEmptyIntelligence());

  const persistLastAnalysis = useCallback((requestKey: string, nextResult: AnalyzeResponse) => {
    if (typeof window === "undefined") return;
    try {
      const payload: StoredAnalysisCache = {
        requestKey,
        result: nextResult,
        savedAt: new Date().toISOString()
      };
      window.localStorage.setItem(LAST_ANALYSIS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore local storage failures
    }
  }, []);

  const readLastAnalysis = useCallback((): StoredAnalysisCache | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(LAST_ANALYSIS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAnalysisCache;
    } catch {
      return null;
    }
  }, []);

  const buildRequestKey = useCallback((payload: {
    contentType: "text" | "image" | "video";
    content: string;
    url?: string;
    imageUrl?: string;
    videoUrl?: string;
    fileName: string;
    creatorId: string;
    creatorName: string;
  }) => {
    const primary = (payload.url || payload.videoUrl || payload.imageUrl || payload.content || "").trim();
    return `${payload.contentType}:${primary}`;
  }, []);

  const applySnapshot = useCallback((snapshot: DashboardSnapshot) => {
    setResult(snapshot.result);
    setRecords(snapshot.records || []);
    setAlerts(snapshot.alerts || []);
    setFeed(snapshot.feed || []);
    setGeneratedAt(snapshot.generatedAt || new Date().toISOString());
    setStorage(snapshot.storage || buildStarterStorage());
    setStats(snapshot.stats);
    setCommunity(snapshot.community || { upvotes: 0, downvotes: 0, consensusLabel: "No community signal yet" });
    setCopilot(snapshot.copilot || buildEmptyCopilot());
    setIntelligence(snapshot.intelligence || buildEmptyIntelligence());
  }, []);

  const refreshSnapshot = useCallback(async (hash?: string) => {
    const snapshot = await api.get<DashboardSnapshot>("/api/dashboard/summary", { params: { hash } });
    applySnapshot(snapshot);
    return snapshot;
  }, [applySnapshot]);

  const fetchHistory = useCallback(async () => {
    const data = await api.get<HistoryResponse>("/api/history");
    setRecords(data.records || []);
    setAlerts(data.trendingAlerts || []);
  }, []);

  const fetchTrustFeed = useCallback(async () => {
    const data = await api.get<TrustFeedResponse>("/api/trust-feed");
    setFeed(data.feed || []);
  }, []);

  const fetchCommunity = useCallback(async (hash: string) => {
    const data = await api.get<CommunityValidation>("/api/community-vote", { params: { hash } });
    setCommunity(data);
  }, []);

  const refreshCopilot = useCallback(async (hash?: string) => {
    const targetHash = hash || result?.record.hash;
    if (!targetHash) {
      setCopilot(buildEmptyCopilot());
      return;
    }
    const [insightsData, suggestionsData, alertsData, userInsightsData] = await Promise.all([
      api.post<CopilotInsightsResponse>("/api/copilot/insights", { hash: targetHash, demoMode: false }),
      api.post<CopilotSuggestionsResponse>("/api/copilot/suggestions", { hash: targetHash, demoMode: false }),
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
  }, [result?.record.hash]);

  const refreshIntelligence = useCallback(async (hash?: string) => {
    const targetHash = hash || result?.record.hash;
    if (!targetHash) {
      setIntelligence(buildEmptyIntelligence());
      return;
    }
    const [globalData, networkData, lineageData, feedData, predictionData] = await Promise.all([
      api.get<IntelligenceGlobalResponse>("/api/intelligence/global", { params: { hash: targetHash } }),
      api.get<IntelligenceNetworkResponse>("/api/intelligence/network", { params: { hash: targetHash } }),
      api.get<IntelligenceLineageResponse>("/api/intelligence/lineage", { params: { hash: targetHash } }),
      api.get<IntelligenceFeedResponse>("/api/intelligence/feed", { params: { hash: targetHash } }),
      api.get<IntelligencePredictionResponse>("/api/intelligence/prediction", { params: { hash: targetHash } })
    ]);

    setIntelligence({
      riskIndex: globalData.riskIndex,
      regions: globalData.regions,
      network: {
        nodes: networkData.nodes,
        edges: networkData.edges
      },
      lineage: lineageData.lineage,
      crossPlatform: lineageData.crossPlatform,
      feed: feedData.feed,
      alerts: feedData.alerts,
      prediction: predictionData.prediction
    });
  }, [result?.record.hash]);

  const refresh = useCallback(async () => {
    await refreshSnapshot(result?.record.hash);
  }, [refreshSnapshot, result?.record.hash]);

  const verifyContent = useCallback(async (payload: {
    contentType: "text" | "image" | "video";
    content: string;
    url?: string;
    imageUrl?: string;
    videoUrl?: string;
    fileName: string;
    creatorId: string;
    creatorName: string;
  }) => {
    setLoading(true);
    setError("");
    try {
      const requestKey = buildRequestKey(payload);
      const currentPrimary = (payload.url || payload.videoUrl || payload.imageUrl || payload.content || "").trim();

      const cachedLocal = readLastAnalysis();
      if (cachedLocal?.requestKey === requestKey) {
        setResult(cachedLocal.result);
        setRecords((current) =>
          cachedLocal.result.record ? [cachedLocal.result.record, ...current.filter((item) => item.id !== cachedLocal.result.record.id)].slice(0, 12) : current
        );
        setLoading(false);
        return;
      }

      try {
        const cachedResponse = await api.get<{ found: boolean; cached: boolean; result: AnalyzeResponse | null }>("/api/analysis", {
          params: {
            input: currentPrimary,
            type: payload.contentType
          },
          cache: "no-store"
        });

        if (cachedResponse?.found && cachedResponse.result) {
          setResult(cachedResponse.result);
          setRecords((current) =>
            cachedResponse.result?.record
              ? [cachedResponse.result.record, ...current.filter((item) => item.id !== cachedResponse.result!.record.id)].slice(0, 12)
              : current
          );
          persistLastAnalysis(requestKey, cachedResponse.result);
          setLoading(false);
          return;
        }
      } catch {
        // continue to live analysis when no cached response exists
      }

      const requestPayload = {
        ...payload,
        input: payload.content
      };
      const data = await api.post<AnalyzeResponse>("/api/analyze", requestPayload, {
        cache: "no-store"
      });
      console.log("LIVE RESULT:", data);
      if (!("record" in data) || !data.record?.hash) {
        throw new Error("Analyze API returned an incomplete response.");
      }

      setResult(data);
      setRecords((current) => [data.record, ...current.filter((item) => item.id !== data.record.id)].slice(0, 12));
      persistLastAnalysis(requestKey, data);
      await refreshSnapshot(data.record.hash);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Live analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [buildRequestKey, persistLastAnalysis, readLastAnalysis, refreshSnapshot]);

  useEffect(() => {
    if (result || initialSnapshot?.result) return;
    const cached = readLastAnalysis();
    if (!cached?.result) return;
    setResult(cached.result);
    if (cached.result.record) {
      setRecords((current) => [cached.result.record, ...current.filter((item) => item.id !== cached.result.record.id)].slice(0, 12));
    }
  }, [initialSnapshot?.result, readLastAnalysis, result]);

  useEffect(() => {
    if (!result) return;
    console.log("UPDATED RESULT:", result);
  }, [result]);

  useEffect(() => {
    if (!result?.record.hash) return;
    const timer = window.setInterval(() => {
      refreshSnapshot(result.record.hash).catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [refreshSnapshot, result?.record.hash]);

  const value = useMemo(
    () => ({
      enterpriseMode,
      setEnterpriseMode,
      loading,
      error,
      result,
      records,
      alerts,
      feed,
      generatedAt,
      storage,
      stats,
      community,
      copilot,
      intelligence,
      verifyContent,
      refresh,
      refreshCopilot,
      refreshIntelligence
    }),
    [alerts, community, copilot, enterpriseMode, error, feed, generatedAt, intelligence, loading, records, refresh, refreshCopilot, refreshIntelligence, result, stats, storage, verifyContent]
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
