export type ContentType = "text" | "image" | "video";
export type ModelVerdict = "real" | "uncertain" | "fake";
export type BlockchainStatus = "confirmed" | "queued";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type TrustLevel = "low" | "medium" | "high";
export type ApiPlan = "free" | "pro" | "enterprise" | "internal";
export type PlatformRole = "user" | "admin" | "enterprise";

export type AnalysisInput = {
  type: ContentType;
  content: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  demoMode?: boolean;
  creatorId?: string;
  creatorName?: string;
};

export type ModelContribution = {
  provider: "groq" | "openrouter" | "gemma" | "huggingface" | "nemotron" | "qwen" | "flux";
  model: string;
  role: string;
  verdict: ModelVerdict;
  truthScore: number;
  confidence: number;
  summary: string;
  signals: string[];
  latencyMs: number;
  usedLiveApi: boolean;
  weight: number;
};

export type PreprocessingReport = {
  contentHash: string;
  mimeType: string;
  byteLength: number;
  metadata: string[];
  sampledFrames: number;
  language?: {
    code: string;
    label: string;
    confidence: number;
  };
};

export type ConsensusReport = {
  label: string;
  meter: number;
  weightedTruthScore: number;
  confidence: number;
  basedOn: string[];
};

export type TrustGraphLink = {
  hash: string;
  label: string;
  similarity: number;
  truthScore: number;
  relationship: string;
};

export type ViralSignal = {
  repeatCount: number;
  trendingScore: number;
  status: "emerging" | "watch" | "viral";
  clusterLabel: string;
};

export type ComparisonVisual = {
  title: string;
  description: string;
  prompt: string;
};

export type TrustFingerprint = {
  truthScore: number;
  manipulationRisk: TrustLevel;
  sourceCredibility: TrustLevel;
  aiConsensus: number;
  similarMatches: number;
  confidence: number;
  fingerprintId: string;
};

export type CreatorProfile = {
  creatorId: string;
  displayName: string;
  credibilityScore: number;
  riskLevel: TrustLevel;
  verifiedBadge: boolean;
  totalUploads: number;
  verifiedCount: number;
  flaggedCount: number;
  contentHistory: string[];
  historySummary: string;
  blockchainIdentityId: string;
  identityStatus: "confirmed" | "queued";
};

export type CommunityValidation = {
  upvotes: number;
  downvotes: number;
  consensusLabel: string;
};

export type AnalysisResult = {
  truthScore: number;
  confidence: number;
  explanation: string;
  executiveSummary: string;
  findings: string[];
  suspiciousSignals: string[];
  detectedClaims: string[];
  modelBreakdown: ModelContribution[];
  preprocessing: PreprocessingReport;
  consensus: ConsensusReport;
  trustFingerprint: TrustFingerprint;
  trustGraph: TrustGraphLink[];
  viralSignal: ViralSignal;
  comparisonVisuals: ComparisonVisual[];
};

export type VerificationRecord = AnalysisResult & {
  id: string;
  hash: string;
  type: ContentType;
  fileName: string;
  creatorId: string;
  creatorProfile: CreatorProfile;
  embedding?: number[];
  timestamp: string;
  firstVerifiedAt: string;
  lastVerifiedAt: string;
  occurrenceCount: number;
  previouslyVerified: boolean;
  blockchainStatus: BlockchainStatus;
  transactionHash: string;
  sourcePreview: string;
};

export type TrendingAlert = {
  id: string;
  label: string;
  riskLevel: RiskLevel;
  region: string;
  volume: number;
  category: string;
};

export type ApiKeyRecord = {
  id: string;
  label: string;
  keyHash: string;
  plan: ApiPlan;
  active: boolean;
  monthlyQuota: number;
  requestsUsed: number;
  createdAt: string;
  lastUsedAt?: string;
};

export type AuthTokenPayload = {
  sub: string;
  role: PlatformRole;
  plan: ApiPlan;
  name: string;
  exp: number;
};

export type PlatformPrincipal = {
  id: string;
  role: PlatformRole;
  plan: ApiPlan;
  name: string;
  source: "api-key" | "jwt" | "guest";
  apiKeyId?: string;
};

export type UsageSnapshot = {
  id: string;
  principalId: string;
  plan: ApiPlan;
  route: string;
  method: string;
  timestamp: string;
};

export type CopilotSeverity = "low" | "medium" | "high";

export type CopilotInsight = {
  id: string;
  title: string;
  detail: string;
  severity: CopilotSeverity;
  kind: "insight" | "behavior" | "learning" | "monitoring";
};

export type CopilotSuggestion = {
  id: string;
  message: string;
  severity: CopilotSeverity;
  recommendation: string;
};

export type CopilotAlert = {
  id: string;
  title: string;
  detail: string;
  severity: CopilotSeverity;
  autoDismissMs?: number;
};

export type CopilotMessage = {
  id: string;
  role: "assistant" | "system";
  content: string;
};

export type UserTrustInsights = {
  trustScore: number;
  exposureLevel: number;
  riskLevel: TrustLevel;
  behaviorSummary: string;
};

export type CopilotLearningState = {
  progress: number;
  status: string;
  updatedAt: string;
};

export type CopilotSnapshot = {
  insights: CopilotInsight[];
  suggestions: CopilotSuggestion[];
  alerts: CopilotAlert[];
  messages: CopilotMessage[];
  userInsights: UserTrustInsights;
  learning: CopilotLearningState;
};

export type IntelligenceRegion = {
  region: string;
  x: string;
  y: string;
  intensity: number;
  riskLevel: TrustLevel;
  activeClusters: number;
};

export type IntelligenceNetworkNode = {
  id: string;
  label: string;
  type: "content" | "creator" | "source";
  x: string;
  y: string;
  cluster: "fake" | "watch" | "clean";
};

export type IntelligenceNetworkEdge = {
  from: string;
  to: string;
  relation: "shared by" | "derived from" | "similar to";
};

export type IntelligenceLineageStep = {
  stage: "Origin" | "Shared" | "Modified" | "Viral" | "Flagged";
  label: string;
  timestamp: string;
};

export type IntelligenceFeedItem = {
  id: string;
  label: string;
  score: number;
  timestamp: string;
  status: "high-risk" | "watch" | "trusted";
  channel: string;
  region: string;
};

export type IntelligenceAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type CrossPlatformHop = {
  platform: string;
  status: "origin" | "spread" | "viral" | "flagged";
  timestamp: string;
};

export type IntelligencePrediction = {
  label: string;
  score: number;
  confidence: number;
  rationale: string;
};

export type GlobalRiskIndex = {
  globalRiskScore: number;
  topRiskRegions: Array<{ region: string; score: number }>;
  trendingFakeTopics: string[];
  highRiskCreators: Array<{ creatorId: string; displayName: string; credibilityScore: number }>;
  riskTrend: Array<{ label: string; score: number }>;
  distribution: Array<{ name: string; value: number }>;
};

export type GlobalIntelligenceSnapshot = {
  riskIndex: GlobalRiskIndex;
  regions: IntelligenceRegion[];
  network: {
    nodes: IntelligenceNetworkNode[];
    edges: IntelligenceNetworkEdge[];
  };
  lineage: IntelligenceLineageStep[];
  feed: IntelligenceFeedItem[];
  alerts: IntelligenceAlert[];
  prediction: IntelligencePrediction;
  crossPlatform: CrossPlatformHop[];
 };

export type AnalyticsReport = {
  generatedAt: string;
  totals: {
    verifications: number;
    creators: number;
    flaggedContent: number;
    averageTruthScore: number;
  };
  distribution: Array<{ label: string; value: number }>;
  trustTrend: Array<{ timestamp: string; score: number }>;
  topRiskCreators: Array<{ creatorId: string; displayName: string; credibilityScore: number; flaggedCount: number; verifiedBadge: boolean }>;
  hotspotRegions: Array<{ region: string; intensity: number }>;
  monetization: {
    apiRequestsTracked: number;
    freeTierUtilization: number;
    enterpriseReady: boolean;
  };
};
