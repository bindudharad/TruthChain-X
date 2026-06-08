import { AnalysisType, Verdict } from "@prisma/client";
import { getPrisma, hasSqlDatabase } from "@/lib/prisma";
import { DashboardAnalyzeResponse } from "@/lib/types";
import { getTrustUserProfile } from "@/server/services/identity/auth";

type SqlUserIdentity = {
  externalId: string;
  email: string;
  name: string;
};

export type ProfileHistorySummary = {
  id: string;
  analysisId: string;
  inputValue: string;
  inputType: string;
  score: number;
  verdict: string;
  confidence: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileHistoryDetail = {
  id: string;
  analysisId: string;
  inputValue: string;
  inputType: string;
  score: number;
  verdict: string;
  confidence: number;
  isBookmarked: boolean;
  explanation: string[];
  safeSignals: string[];
  riskSignals: string[];
  reports: Array<{
    id: string;
    title: string;
    source: string;
    url: string;
    image: string | null;
    description: string | null;
  }>;
  similarity: Array<{
    id: string;
    title: string;
    source: string | null;
    url: string | null;
    image: string | null;
    matchPercent: number;
  }>;
  analysisResult: DashboardAnalyzeResponse | null;
  createdAt: string;
  updatedAt: string;
};

export type TrendingInsight = {
  inputValue: string;
  count: number;
};

function toAnalysisType(type: DashboardAnalyzeResponse["record"]["type"]): AnalysisType {
  if (type === "url") return "url";
  if (type === "text") return "text";
  if (type === "image") return "image";
  if (type === "video") return "video";
  return "qr";
}

function toVerdict(verdict: DashboardAnalyzeResponse["record"]["consensus"]["label"] | DashboardAnalyzeResponse["record"]["claimVerification"]["verdict"] | string): Verdict {
  if (verdict === "SAFE" || verdict === "verified") return "SAFE";
  if (verdict === "SUSPICIOUS" || verdict === "unverified" || verdict === "not_applicable") return "SUSPICIOUS";
  return "HIGH_RISK";
}

export function resolveSqlUserIdentity(externalId: string): SqlUserIdentity | null {
  const profile = getTrustUserProfile(externalId);
  if (!profile) return null;

  return {
    externalId,
    email: profile.email,
    name: profile.displayName
  };
}

async function ensureSqlUser(identity: SqlUserIdentity) {
  const prisma = getPrisma();
  return prisma.user.upsert({
    where: { externalId: identity.externalId },
    update: {
      email: identity.email,
      name: identity.name
    },
    create: {
      externalId: identity.externalId,
      email: identity.email,
      name: identity.name
    }
  });
}

export async function saveProfileHistoryEntry(identity: SqlUserIdentity, result: DashboardAnalyzeResponse) {
  if (!hasSqlDatabase()) return null;
  if (!result.record?.hash) return null;

  const prisma = getPrisma();
  const sqlUser = await ensureSqlUser(identity);
  const analysis = await prisma.analysis.findFirst({
    where: {
      OR: [{ recordHash: result.record.hash }, { inputHash: result.record.preprocessing.contentHash }]
    },
    select: { id: true }
  });

  if (!analysis?.id) {
    return null;
  }

  const explanation = Array.from(
    new Set([result.reason, result.explanation, ...(result.details || []), ...(result.reasons || [])].filter(Boolean))
  );
  const safeSignals = Array.from(
    new Set(
      [
        ...(result.unified?.safeReasons || []),
        ...((result.record?.explainability || [])
          .filter((item) => item.impact === "positive")
          .map((item) => item.detail || item.label) || [])
      ].filter(Boolean)
    )
  );
  const riskSignals = Array.from(
    new Set(
      [
        ...(result.unified?.unsafeReasons || []),
        ...((result.record?.explainability || [])
          .filter((item) => item.impact === "negative")
          .map((item) => item.detail || item.label) || []),
        ...(result.record?.suspiciousSignals || [])
      ].filter(Boolean)
    )
  );

  await prisma.analysisDetails.upsert({
    where: { analysisId: analysis.id },
    update: {
      safeSignals,
      riskSignals,
      explanation
    },
    create: {
      analysisId: analysis.id,
      safeSignals,
      riskSignals,
      explanation
    }
  });

  const inputValue = result.analyzedUrl || result.record.url || result.record.sourcePreview || result.record.fileName;

  const historyEntry = await prisma.analysisHistory.upsert({
    where: {
      userId_inputValue: {
        userId: sqlUser.id,
        inputValue
      }
    },
    update: {
      analysisId: analysis.id,
      inputType: toAnalysisType(result.record.type),
      score: result.score,
      verdict: toVerdict(result.record.consensus.label),
      updatedAt: new Date()
    },
    create: {
      userId: sqlUser.id,
      analysisId: analysis.id,
      inputValue,
      inputType: toAnalysisType(result.record.type),
      score: result.score,
      verdict: toVerdict(result.record.consensus.label)
    }
  });

  await prisma.userInsight.upsert({
    where: {
      userId_inputValue: {
        userId: sqlUser.id,
        inputValue
      }
    },
    update: {
      count: {
        increment: 1
      }
    },
    create: {
      userId: sqlUser.id,
      inputValue,
      count: 1
    }
  });

  return historyEntry;
}

export async function getProfileHistoryList(
  externalId: string,
  options?: { search?: string; type?: string; verdict?: string; bookmarked?: boolean; page?: number; pageSize?: number }
) {
  if (!hasSqlDatabase()) {
    return { items: [] as ProfileHistorySummary[], total: 0, page: 1, pageSize: 10, storageAvailable: false };
  }

  const identity = resolveSqlUserIdentity(externalId);
  if (!identity) {
    return { items: [] as ProfileHistorySummary[], total: 0, page: 1, pageSize: 10, storageAvailable: true };
  }

  const prisma = getPrisma();
  const sqlUser = await ensureSqlUser(identity);
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(20, Math.max(1, options?.pageSize || 10));
  const search = options?.search?.trim();
  const type = options?.type?.trim();
  const verdict = options?.verdict?.trim();
  const bookmarked = options?.bookmarked;

  const where = {
    userId: sqlUser.id,
    ...(search
      ? {
          inputValue: {
            contains: search,
            mode: "insensitive" as const
          }
        }
      : {}),
    ...(type && type !== "all"
      ? {
          inputType: type as AnalysisType
        }
      : {}),
    ...(verdict && verdict !== "all"
      ? {
          verdict: verdict === "RISK" ? "HIGH_RISK" : (verdict as Verdict)
        }
      : {}),
    ...(bookmarked ? { isBookmarked: true } : {})
  };

  const [total, history] = await Promise.all([
    prisma.analysisHistory.count({ where }),
    prisma.analysisHistory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        analysis: {
          select: {
            id: true,
            confidence: true
          }
        }
      }
    })
  ]);

  return {
    items: history.map((item) => ({
      id: item.id,
      analysisId: item.analysisId,
      inputValue: item.inputValue,
      inputType: item.inputType,
      score: item.score,
      verdict: item.verdict,
      confidence: item.analysis.confidence,
      isBookmarked: item.isBookmarked,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    })),
    total,
    page,
    pageSize,
    storageAvailable: true
  };
}

export async function getProfileHistoryDetail(externalId: string, historyId: string): Promise<ProfileHistoryDetail | null> {
  if (!hasSqlDatabase()) return null;
  const identity = resolveSqlUserIdentity(externalId);
  if (!identity) return null;

  const prisma = getPrisma();
  const sqlUser = await ensureSqlUser(identity);
  const entry = await prisma.analysisHistory.findFirst({
    where: {
      id: historyId,
      userId: sqlUser.id
    },
    include: {
      analysis: {
        include: {
          details: true,
          reports: true,
          similarities: true
        }
      }
    }
  });

  if (!entry) return null;

  const payload = entry.analysis.responseJson as DashboardAnalyzeResponse | null;

  return {
    id: entry.id,
    analysisId: entry.analysisId,
    inputValue: entry.inputValue,
    inputType: entry.inputType,
    score: entry.score,
    verdict: entry.verdict,
    confidence: entry.analysis.confidence,
    isBookmarked: entry.isBookmarked,
    explanation: Array.isArray(entry.analysis.details?.explanation) ? (entry.analysis.details?.explanation as string[]) : payload?.details || [entry.analysis.explanation],
    safeSignals: Array.isArray(entry.analysis.details?.safeSignals) ? (entry.analysis.details?.safeSignals as string[]) : payload?.unified?.safeReasons || [],
    riskSignals: Array.isArray(entry.analysis.details?.riskSignals) ? (entry.analysis.details?.riskSignals as string[]) : payload?.unified?.unsafeReasons || [],
    reports: entry.analysis.reports.map((report) => ({
      id: report.id,
      title: report.title,
      source: report.source || report.author || "External source",
      url: report.sourceUrl,
      image: report.image,
      description: report.description
    })),
    similarity: entry.analysis.similarities.map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      image: item.image,
      matchPercent: item.matchPercentage
    })),
    analysisResult: payload,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}

export async function toggleProfileBookmark(externalId: string, historyId: string) {
  if (!hasSqlDatabase()) {
    return { storageAvailable: false, isBookmarked: false };
  }

  const identity = resolveSqlUserIdentity(externalId);
  if (!identity) {
    throw new Error("Profile not found.");
  }

  const prisma = getPrisma();
  const sqlUser = await ensureSqlUser(identity);
  const entry = await prisma.analysisHistory.findFirst({
    where: {
      id: historyId,
      userId: sqlUser.id
    },
    select: {
      id: true,
      analysisId: true,
      isBookmarked: true
    }
  });

  if (!entry) {
    throw new Error("History item not found.");
  }

  const nextValue = !entry.isBookmarked;
  const updated = await prisma.analysisHistory.update({
    where: { id: entry.id },
    data: { isBookmarked: nextValue }
  });

  const bookmarkCount = await prisma.analysisHistory.count({
    where: {
      analysisId: entry.analysisId,
      isBookmarked: true
    }
  });

  await prisma.analysis.update({
    where: { id: entry.analysisId },
    data: { isBookmarked: bookmarkCount > 0 }
  });

  return {
    storageAvailable: true,
    isBookmarked: updated.isBookmarked
  };
}

export async function getTrendingInsights(externalId: string) {
  if (!hasSqlDatabase()) {
    return { items: [] as TrendingInsight[], storageAvailable: false };
  }

  const identity = resolveSqlUserIdentity(externalId);
  if (!identity) {
    return { items: [] as TrendingInsight[], storageAvailable: true };
  }

  const prisma = getPrisma();
  const sqlUser = await ensureSqlUser(identity);
  const insights = await prisma.userInsight.findMany({
    where: { userId: sqlUser.id },
    orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
    take: 6
  });

  return {
    items: insights.map((item) => ({
      inputValue: item.inputValue,
      count: item.count
    })),
    storageAvailable: true
  };
}
