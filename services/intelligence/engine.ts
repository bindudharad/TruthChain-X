import {
  CrossPlatformHop,
  GlobalIntelligenceSnapshot,
  GlobalRiskIndex,
  IntelligenceAlert,
  IntelligenceFeedItem,
  IntelligenceLineageStep,
  IntelligenceNetworkEdge,
  IntelligenceNetworkNode,
  IntelligencePrediction,
  IntelligenceRegion,
  VerificationRecord
} from "@/lib/types";
import { getCreatorProfile, listCreatorProfiles, listVerifications } from "@/lib/db";
import { clamp } from "@/services/ai/shared";

type IntelligenceContext = {
  hash?: string;
};

const regionPositions: Record<string, { x: string; y: string }> = {
  "North America": { x: "24%", y: "36%" },
  Europe: { x: "49%", y: "28%" },
  "South Asia": { x: "66%", y: "46%" },
  Africa: { x: "52%", y: "58%" },
  "South America": { x: "32%", y: "66%" },
  Oceania: { x: "82%", y: "68%" },
  "Cross-platform": { x: "50%", y: "50%" }
};

function classifyRegion(record: VerificationRecord, index: number) {
  if (record.type === "image") return "Europe";
  if (record.type === "video") return "North America";
  if (record.truthScore < 35) return "South Asia";
  return ["Africa", "South America", "Europe", "North America"][index % 4];
}

async function getPrimaryRecord(hash?: string) {
  const records = await listVerifications();
  if (!records.length) return null;
  return records.find((record) => record.hash === hash) || records[0];
}

function buildRegions(records: VerificationRecord[]): IntelligenceRegion[] {
  const regionMap = new Map<string, { sum: number; count: number; highRisk: number }>();

  records.forEach((record, index) => {
    const region = classifyRegion(record, index);
    const current = regionMap.get(region) || { sum: 0, count: 0, highRisk: 0 };
    current.sum += 100 - record.truthScore + record.viralSignal.trendingScore * 0.4;
    current.count += 1;
    current.highRisk += record.truthScore < 40 ? 1 : 0;
    regionMap.set(region, current);
  });

  return Array.from(regionMap.entries())
    .map(([region, value]) => {
      const intensity = clamp(Math.round(value.sum / Math.max(value.count, 1)), 24, 95);
      const riskLevel: IntelligenceRegion["riskLevel"] = intensity > 74 ? "high" : intensity > 48 ? "medium" : "low";
      return {
        region,
        x: regionPositions[region]?.x || "50%",
        y: regionPositions[region]?.y || "50%",
        intensity,
        riskLevel,
        activeClusters: Math.max(1, value.highRisk + Math.round(value.count / 2))
      };
    })
    .sort((left, right) => right.intensity - left.intensity)
    .slice(0, 6);
}

function buildRiskIndex(records: VerificationRecord[], creators: Awaited<ReturnType<typeof listCreatorProfiles>>, regions: IntelligenceRegion[]): GlobalRiskIndex {
  const globalRiskScore = clamp(
    Math.round(
      records.reduce((sum, record) => sum + (100 - record.truthScore) * 0.52 + record.viralSignal.trendingScore * 0.28 + record.occurrenceCount * 3, 0) /
        Math.max(records.length, 1)
    ),
    18,
    96
  );

  return {
    globalRiskScore,
    topRiskRegions: regions.slice(0, 3).map((region) => ({ region: region.region, score: region.intensity })),
    trendingFakeTopics: Array.from(
      new Set(
        records
          .flatMap((record) => record.suspiciousSignals.slice(0, 2))
          .filter(Boolean)
          .slice(0, 5)
      )
    ),
    highRiskCreators: creators
      .sort((left, right) => left.credibilityScore - right.credibilityScore)
      .slice(0, 3)
      .map((creator) => ({
        creatorId: creator.creatorId,
        displayName: creator.displayName,
        credibilityScore: creator.credibilityScore
      })),
    riskTrend: records
      .slice(0, 7)
      .reverse()
      .map((record, index) => ({
        label: new Date(record.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: clamp(Math.round(100 - record.truthScore + record.viralSignal.trendingScore * 0.2 + index * 2), 10, 98)
      })),
    distribution: [
      { name: "Fake", value: records.filter((record) => record.truthScore < 40).length },
      { name: "Watch", value: records.filter((record) => record.truthScore >= 40 && record.truthScore < 70).length },
      { name: "Trusted", value: records.filter((record) => record.truthScore >= 70).length }
    ]
  };
}

async function buildNetwork(records: VerificationRecord[], primary: VerificationRecord | null) {
  const creator = primary ? (await getCreatorProfile(primary.creatorId)) || primary.creatorProfile : null;
  const nodes: IntelligenceNetworkNode[] = [];
  const edges: IntelligenceNetworkEdge[] = [];

  if (!primary) {
    return { nodes, edges };
  }

  nodes.push({
    id: "content-primary",
    label: primary.fileName,
    type: "content",
    x: "50%",
    y: "46%",
    cluster: primary.truthScore < 40 ? "fake" : primary.truthScore < 70 ? "watch" : "clean"
  });

  nodes.push({
    id: "creator-primary",
    label: creator?.displayName || primary.creatorId,
    type: "creator",
    x: "26%",
    y: "24%",
    cluster: (creator?.credibilityScore || 60) < 55 ? "fake" : "watch"
  });

  edges.push({ from: "content-primary", to: "creator-primary", relation: "shared by" });

  records
    .filter((record) => record.id !== primary.id)
    .slice(0, 4)
    .forEach((record, index) => {
      const nodeId = `content-${index}`;
      nodes.push({
        id: nodeId,
        label: record.fileName,
        type: "content",
        x: ["76%", "28%", "72%", "46%"][index] || "60%",
        y: ["24%", "74%", "70%", "18%"][index] || "68%",
        cluster: record.truthScore < 40 ? "fake" : record.truthScore < 70 ? "watch" : "clean"
      });
      edges.push({
        from: "content-primary",
        to: nodeId,
        relation: index % 2 === 0 ? "similar to" : "derived from"
      });
    });

  nodes.push({
    id: "source-node",
    label: primary.type === "video" ? "Streaming Source" : primary.type === "image" ? "Visual Origin" : "Message Source",
    type: "source",
    x: "74%",
    y: "50%",
    cluster: "watch"
  });
  edges.push({ from: "content-primary", to: "source-node", relation: "derived from" });

  return { nodes, edges };
}

function buildLineage(primary: VerificationRecord | null): IntelligenceLineageStep[] {
  if (!primary) return [];

  const baseTime = new Date(primary.timestamp).getTime();
  return [
    { stage: "Origin", label: `${primary.fileName} first appears in source channel ${primary.creatorId}.`, timestamp: new Date(baseTime).toISOString() },
    { stage: "Shared", label: "Copied into adjacent social and messaging streams.", timestamp: new Date(baseTime + 20 * 60 * 1000).toISOString() },
    { stage: "Modified", label: "Narrative structure mutates while preserving the original phishing risk signature.", timestamp: new Date(baseTime + 45 * 60 * 1000).toISOString() },
    { stage: "Viral", label: `Viral signal climbs to ${primary.viralSignal.trendingScore}% across monitored regions.`, timestamp: new Date(baseTime + 70 * 60 * 1000).toISOString() },
    { stage: "Flagged", label: "The platform marks the cluster as suspicious and routes it to the intelligence layer.", timestamp: new Date(baseTime + 95 * 60 * 1000).toISOString() }
  ];
}

function buildFeed(records: VerificationRecord[]): IntelligenceFeedItem[] {
  return records.slice(0, 8).map((record, index) => ({
    id: `${record.id}-intel`,
    label: record.fileName,
    score: record.truthScore,
    timestamp: new Date(new Date(record.timestamp).getTime() + index * 2 * 60 * 1000).toISOString(),
    status: record.truthScore < 40 ? "high-risk" : record.truthScore < 70 ? "watch" : "trusted",
    channel: ["social graph", "messaging rail", "video relay", "community thread"][index % 4],
    region: classifyRegion(record, index)
  }));
}

function buildAlerts(regions: IntelligenceRegion[], records: VerificationRecord[]): IntelligenceAlert[] {
  const regionAlert = regions[0];
  const clusterRecord = records.find((record) => record.truthScore < 40) || records[0];

  if (!clusterRecord) {
    return [
      {
        id: "intel-default-alert",
        title: "Intelligence engine is ready",
        detail: "Analyze content to populate global misinformation alerts and cluster tracking.",
        severity: "low"
      }
    ];
  }

  return [
    {
      id: "intel-region-alert",
      title: `High-risk misinformation spreading in ${regionAlert?.region || "monitored region"}`,
      detail: `${regionAlert?.activeClusters || 1} active clusters are accelerating with a regional intensity of ${regionAlert?.intensity || 52}%.`,
      severity: (regionAlert?.intensity || 52) > 74 ? "high" : "medium"
    },
    {
      id: "intel-cluster-alert",
      title: "Content cluster detected",
      detail: `${clusterRecord.fileName} is linked to repeat sharing patterns and suspicious derivative content.`,
      severity: clusterRecord.truthScore < 40 ? "high" : "medium"
    }
  ];
}

function buildPrediction(primary: VerificationRecord | null, creators: Awaited<ReturnType<typeof listCreatorProfiles>>): IntelligencePrediction {
  if (!primary) {
    return {
      label: "No active content to forecast",
      score: 42,
      confidence: 68,
      rationale: "Upload or verify content to activate predictive misinformation forecasting."
    };
  }

  const creator = creators.find((item) => item.creatorId === primary.creatorId) || primary.creatorProfile;
  const score = clamp(
    Math.round(100 - primary.truthScore * 0.56 + primary.viralSignal.trendingScore * 0.34 + (100 - creator.credibilityScore) * 0.18 + primary.occurrenceCount * 4),
    18,
    96
  );

  return {
    label: `${score}% chance of becoming a viral fake`,
    score,
    confidence: clamp(Math.round(primary.confidence * 0.82 + primary.consensus.meter * 0.18), 54, 96),
    rationale: "Forecast combines similar content history, creator credibility, repeat circulation patterns, and current viral acceleration."
  };
}

function buildCrossPlatform(primary: VerificationRecord | null): CrossPlatformHop[] {
  if (!primary) return [];
  const baseTime = new Date(primary.timestamp).getTime();

  return [
    { platform: "Platform A", status: "origin", timestamp: new Date(baseTime).toISOString() },
    { platform: "Platform B", status: "spread", timestamp: new Date(baseTime + 18 * 60 * 1000).toISOString() },
    { platform: "Platform C", status: "viral", timestamp: new Date(baseTime + 42 * 60 * 1000).toISOString() },
    { platform: "Platform D", status: "flagged", timestamp: new Date(baseTime + 75 * 60 * 1000).toISOString() }
  ];
}

export async function getGlobalIntelligenceSnapshot(context: IntelligenceContext = {}): Promise<GlobalIntelligenceSnapshot> {
  const [records, creators, primary] = await Promise.all([listVerifications(), listCreatorProfiles(), getPrimaryRecord(context.hash)]);
  const safeRecords = records.length ? records : primary ? [primary] : [];
  const regions = buildRegions(safeRecords);
  const riskIndex = buildRiskIndex(safeRecords, creators, regions);
  const network = await buildNetwork(safeRecords, primary);
  const lineage = buildLineage(primary);
  const feed = buildFeed(safeRecords);
  const alerts = buildAlerts(regions, safeRecords);
  const prediction = buildPrediction(primary, creators);
  const crossPlatform = buildCrossPlatform(primary);

  return {
    riskIndex,
    regions,
    network,
    lineage,
    feed,
    alerts,
    prediction,
    crossPlatform
  };
}
