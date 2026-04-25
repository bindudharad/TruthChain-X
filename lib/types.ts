export type ContentType = "text" | "image" | "video";
export type ModelVerdict = "real" | "uncertain" | "fake";
export type BlockchainStatus = "confirmed" | "queued";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type TrustLevel = "low" | "medium" | "high";
export type ApiPlan = "free" | "pro" | "enterprise" | "internal";
export type PlatformRole = "user" | "moderator" | "admin" | "enterprise";

export type AnalysisInput = {
  type: ContentType;
  content: string;
  url?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  demoMode?: boolean;
  creatorId?: string;
  creatorName?: string;
};

export type PhishingRiskLevel = "safe" | "suspicious" | "dangerous";

export type PhishingAssessment = {
  analyzedUrl?: string;
  domain?: string;
  phishingRiskScore: number;
  riskLevel: PhishingRiskLevel;
  attackType: "url-spoofing" | "social-engineering" | "credential-trap" | "suspicious-content";
  reasons: string[];
  similarityScore: number;
};

export type MediaAnalysisResult = {
  suspicious: boolean;
  findings: string[];
  sourceUrl?: string;
};

export type MediaAnalysisSummary = {
  image: MediaAnalysisResult | null;
  video: MediaAnalysisResult | null;
};

export type AIGeneratedTextDetection = {
  aiGeneratedProbability: number;
  isLikelyAIGenerated: boolean;
  signals: string[];
};

export type AIGeneratedImageDetection = {
  aiGeneratedImage: boolean;
  confidence: number;
  signals: string[];
};

export type AIDetectionSummary = {
  text: AIGeneratedTextDetection | null;
  image: AIGeneratedImageDetection | null;
};

export type SensitiveContentCategory = "scam" | "harmful" | "nsfw" | "spam";

export type SensitiveContentSummary = {
  isSensitive: boolean;
  categories: SensitiveContentCategory[];
  severity: "low" | "medium" | "high";
  signals: string[];
};

export type QRContentType = "url" | "text" | "unknown";

export type QRDecodeResult = {
  rawData: string;
  type: QRContentType;
};

export type ClaimCategory = "public-figure" | "politics" | "health" | "major-event";
export type ClaimType = "scientific" | "news/event" | "location" | "health" | "general";

export type ExtractedClaim = {
  text: string;
  type: ClaimType;
  categories: ClaimCategory[];
  highVerificationRequired: boolean;
};

export type VerificationSourceHit = {
  title: string;
  source: string;
  url: string;
  snippet?: string;
  publishedAt?: string;
  sourceType: "news" | "search" | "fact-check" | "knowledge";
};

export type FactCheckArticle = {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt?: string;
  sourceType: "gnews" | "newsapi" | "serper";
};

export type FactCheckSummary = {
  sourcesFound: number;
  verified: boolean;
  verdict: "TRUE" | "FALSE" | "UNVERIFIED";
  contradictionFound: boolean;
  summary: string;
  articles: FactCheckArticle[];
};

export type ReverseImageMatch = {
  thumbnail: string;
  title: string;
  link: string;
  source: string;
  snippet?: string;
  aiSummary: string;
  trustScore: number;
  suspicious: boolean;
};

export type ReverseImageSearchResponse = {
  imageUrl: string;
  results: ReverseImageMatch[];
  searchedAt: string;
  searchedWith: "serpapi";
  note?: string;
};

export type UniversalContentMode = "text" | "image" | "video" | "url";

export type UniversalSourceCard = {
  thumbnail?: string;
  title: string;
  link: string;
  source: string;
  snippet?: string;
  aiSummary: string;
  trustScore: number;
  suspicious: boolean;
};

export type UniversalAnalysisResponse = {
  mode: UniversalContentMode;
  query: string;
  title?: string;
  explanation: string;
  trustScore: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: "Safe" | "Suspicious" | "Risk";
  tags: string[];
  cards: UniversalSourceCard[];
  metadata?: Record<string, string | number | boolean | null>;
};

export type ClaimVerificationSummary = {
  claims?: ExtractedClaim[];
  claimStatus?: "Verified" | "Unverified" | "False" | "NotApplicable";
  claimDetected: boolean;
  verificationRequired: boolean;
  categories: ClaimCategory[];
  suspiciousClaimPatterns: string[];
  trustedContextDetected: boolean;
  credibleSourcePresent: boolean;
  noTrustedSource: boolean;
  verified: boolean;
  sourcesFound: number;
  trustedSourcesCount: number;
  verificationScore?: number;
  verdict: "verified" | "unverified" | "misleading" | "not_applicable";
  confidence: number;
  checkedLive: boolean;
  query: string;
  trustedSources: VerificationSourceHit[];
  factCheckHits: VerificationSourceHit[];
  tags: string[];
  reason: string;
  summary: string;
  explanation: string[];
};

export type QRScanResponse = {
  qrContent: string;
  type: QRContentType;
  phishing: PhishingAssessment;
  aiDetection: AIDetectionSummary;
  mediaAnalysis: MediaAnalysisSummary;
  sensitiveContent: SensitiveContentSummary;
  claimVerification: ClaimVerificationSummary;
  unified: UnifiedTrustResult;
  finalVerdict: "safe" | "suspicious" | "dangerous";
  explanation: string[];
  canOpen: boolean;
};

export type UnifiedCategory = "SAFE" | "SUSPICIOUS" | "SPAM";
export type UnifiedColor = "green" | "yellow" | "red";
export type SpamCategory = "Safe" | "Suspicious" | "Risk";
export type SpamColor = "green" | "yellow" | "red";

export type SpamFeatures = {
  hasSuspiciousLinks: boolean;
  hasUrgencyWords: boolean;
  hasAllCaps: boolean;
  hasRepeatedText: boolean;
  hasPhishingKeywords: boolean;
  hasViralMisinformationPattern: boolean;
  hasSuspiciousClaimLanguage: boolean;
  hasCredentialBait: boolean;
  hasCredibleSource: boolean;
  hasPublicFigureClaim: boolean;
  hasPoliticalClaim: boolean;
  hasHealthClaim: boolean;
  hasMajorEventClaim: boolean;
  requiresVerification: boolean;
};

export type SimpleSpamOutput = {
  score: number;
  category: SpamCategory;
  color: SpamColor;
  reason: string;
  features: SpamFeatures;
  tags?: string[];
  details?: string[];
};

export type UnifiedFeature = {
  id: string;
  label: string;
  weight: number;
  source: "url" | "text" | "media" | "ai" | "sensitive" | "similarity" | "qr";
  polarity: "safe" | "unsafe";
};

export type UnifiedTrustResult = {
  score: number;
  category: UnifiedCategory;
  color: UnifiedColor;
  reason: string;
  safeScore: number;
  unsafeScore: number;
  safeReasons: string[];
  unsafeReasons: string[];
  features: UnifiedFeature[];
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

export type OpenSourceSignal = {
  id: string;
  kind: "news" | "dataset" | "community";
  title: string;
  summary: string;
  score: number;
  confidence: number;
  stance: "supports" | "challenges" | "mixed";
  source: string;
  url: string;
};

export type ExplainabilityFactor = {
  label: "AI Analysis" | "Source Credibility" | "History" | "Similarity" | "Open-Source Signals";
  value: number;
  weight: number;
  impact: "positive" | "negative" | "neutral";
  detail: string;
};

export type FactTimelineStep = {
  stage: "origin" | "spread" | "flagged" | "verified";
  title: string;
  detail: string;
  timestamp: string;
  status: "complete" | "active" | "watch";
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

export type DashboardFeedItem = {
  id: string;
  label: string;
  score: number;
  timestamp: string;
  status: string;
  channel: string;
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
  openSourceSignals: OpenSourceSignal[];
  explainability: ExplainabilityFactor[];
  factTimeline: FactTimelineStep[];
  phishingAssessment?: PhishingAssessment;
  mediaAnalysis: MediaAnalysisSummary;
  aiDetection: AIDetectionSummary;
  sensitiveContent: SensitiveContentSummary;
  claimVerification: ClaimVerificationSummary;
  unified: UnifiedTrustResult;
};

export type VerificationRecord = AnalysisResult & {
  id: string;
  hash: string;
  type: ContentType;
  fileName: string;
  url?: string;
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

export type SimilarityPlatform = "Facebook" | "X" | "TikTok" | "Instagram" | "YouTube" | "Telegram" | "TruthChain";

export type SimilarityIndexEntry = {
  id: string;
  hash: string;
  type: ContentType;
  content: string;
  preview: string;
  source: SimilarityPlatform;
  url: string;
  trustScore: number;
  caption: string;
  embedding: number[];
  platforms: SimilarityPlatform[];
  reportCount: number;
  severity: "low" | "medium" | "high";
  createdAt: string;
};

export type SimilarityMatch = {
  matchId: string;
  similarityScore: number;
  matchedContent: string;
  preview: string;
  source: SimilarityPlatform;
  url: string;
  caption: string;
  trustScore: number;
  platforms: SimilarityPlatform[];
  reportCount: number;
  severity: "low" | "medium" | "high";
};

export type ReportDispatchMode = "link" | "api" | "demo";
export type ReportLifecycleStatus = "pending" | "sent" | "reviewed" | "ready";

export type UnifiedReportDraft = {
  contentId: string;
  reason: string;
  similarityScore: number;
  trustScore: number;
  explanation: string;
  suspiciousParts: string[];
};

export type UnifiedReportDispatch = {
  mode: ReportDispatchMode;
  status: ReportLifecycleStatus;
  message: string;
  reportingUrl?: string;
  provider?: string;
};

export type FraudReportRecord = {
  id: string;
  matchId: string;
  hash: string;
  userId?: string;
  reason: string;
  explanation?: string;
  similarityScore?: number;
  trustScore?: number;
  action: "report" | "takedown";
  platform: SimilarityPlatform;
  status?: ReportLifecycleStatus;
  dispatchMode?: ReportDispatchMode;
  reportingUrl?: string;
  createdAt: string;
};

export type ReportingAuditLogEntry = {
  id: string;
  actorId: string;
  action: "report-created" | "dispatch-sent" | "status-updated" | "selection-reviewed";
  contentId: string;
  detail: string;
  timestamp: string;
};

export type BulkReportResult = {
  reportId: string;
  contentId: string;
  platform: SimilarityPlatform;
  status: ReportLifecycleStatus;
  reason: string;
  explanation: string;
  dispatch: UnifiedReportDispatch;
};

export type VerificationStatus = "unverified" | "pending" | "verified";

export type UserBadge = "Verified" | "Trusted Reporter" | "High Credibility";

export type UserTrustPassport = {
  userId: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  plan: ApiPlan;
  trustScore: number;
  riskLevel: TrustLevel;
  reportsCount: number;
  contentHistory: string[];
  verificationStatus: VerificationStatus;
  badges: UserBadge[];
  reportsAccuracy: number;
  permissions: string[];
  uploadRestricted: boolean;
  blockchainIdentityHash: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type UserAccount = UserTrustPassport & {
  passwordHash: string;
  passwordSalt: string;
  oauthProvider?: "google" | "github";
  walletAddress?: string;
  behaviorFlags: string[];
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

export type DashboardAnalyzeResponse = {
  score: number;
  category: SpamCategory;
  color: SpamColor;
  reason: string;
  features: SpamFeatures;
  claims?: ExtractedClaim[];
  claimStatus?: "Verified" | "Unverified" | "False" | "NotApplicable";
  verification?: {
    verified: boolean;
    confidence: number;
    sourcesFound: number;
    trustedSources: number;
    verdict: "TRUE" | "UNVERIFIED" | "MISLEADING";
    summary: string;
  };
  simpleOutput?: SimpleSpamOutput;
  details?: string[];
  tags?: string[];
  trustScore: number;
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
  phishingRiskScore?: number;
  riskLevel?: PhishingRiskLevel;
  attackType?: string;
  reasons?: string[];
  analyzedUrl?: string;
  similarityScore?: number;
  similarMatches?: SimilarityMatch[];
  aiDetection?: AIDetectionSummary;
  mediaAnalysis?: MediaAnalysisSummary;
  sensitiveContent?: SensitiveContentSummary;
  unified?: UnifiedTrustResult;
  claimVerification?: ClaimVerificationSummary;
  factCheck?: FactCheckSummary;
};

export type DashboardStorageInfo = {
  mode: "mongo" | "local-json";
  hasMongoUri: boolean;
  usingMongo: boolean;
};

export type DashboardStats = {
  totalAlerts: number;
  recentScans: number;
  averageScore: number;
  lastVerdict: string;
  verificationStats: {
    verified: number;
    unverified: number;
    misleading: number;
    liveChecked: number;
  };
};

export type DashboardSnapshot = {
  generatedAt: string;
  storage: DashboardStorageInfo;
  stats: DashboardStats;
  result: DashboardAnalyzeResponse;
  records: VerificationRecord[];
  alerts: TrendingAlert[];
  feed: DashboardFeedItem[];
  community: CommunityValidation;
  copilot: CopilotSnapshot;
  intelligence: GlobalIntelligenceSnapshot;
};
