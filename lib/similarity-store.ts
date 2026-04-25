import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateEmbedding } from "@/lib/embeddings";
import { hashContent } from "@/lib/hashing";
import {
  FraudReportRecord,
  ReportingAuditLogEntry,
  SimilarityIndexEntry,
  SimilarityPlatform,
  VerificationRecord
} from "@/lib/types";

const dataDir = join(process.cwd(), "data");
const indexFile = join(dataDir, "match-index.json");
const reportsFile = join(dataDir, "fraud-reports.json");
const auditFile = join(dataDir, "report-audit-log.json");

const seededMatches: Array<{
  type: "text" | "image";
  content: string;
  source: SimilarityPlatform;
  url: string;
  caption: string;
  trustScore: number;
  platforms: SimilarityPlatform[];
}> = [
  {
    type: "text",
    content: "Breaking: Scientists confirm drinking silver solution eliminates all viruses in 24 hours. Share before this gets removed.",
    source: "Facebook",
    url: "https://facebook.example/demo/silver-solution",
    caption: "Miracle cure post spreading in health groups",
    trustScore: 18,
    platforms: ["Facebook", "Telegram", "X"]
  },
  {
    type: "text",
    content: "Urgent warning: a hidden government report proves this emergency treatment works instantly. Forward now.",
    source: "Telegram",
    url: "https://telegram.example/demo/urgent-forward",
    caption: "Forwarded chain message with altered wording",
    trustScore: 26,
    platforms: ["Telegram", "Facebook"]
  },
  {
    type: "image",
    content: "Celebrity selfie with mismatched lighting and blurred ear edges",
    source: "Instagram",
    url: "https://instagram.example/demo/celebrity-selfie",
    caption: "Likely edited celebrity selfie reused across visual platforms",
    trustScore: 24,
    platforms: ["Instagram", "TikTok", "X"]
  },
  {
    type: "image",
    content: "Campaign speech clip frame with lip-sync drift and inconsistent blinking",
    source: "YouTube",
    url: "https://youtube.example/demo/campaign-clip",
    caption: "Video frame shared as proof of a fabricated speech moment",
    trustScore: 22,
    platforms: ["YouTube", "TikTok", "Facebook"]
  }
];

function ensureFiles() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(indexFile)) writeFileSync(indexFile, "[]", "utf8");
  if (!existsSync(reportsFile)) writeFileSync(reportsFile, "[]", "utf8");
  if (!existsSync(auditFile)) writeFileSync(auditFile, "[]", "utf8");
}

function readIndex() {
  ensureFiles();
  return JSON.parse(readFileSync(indexFile, "utf8")) as SimilarityIndexEntry[];
}

function writeIndex(entries: SimilarityIndexEntry[]) {
  ensureFiles();
  writeFileSync(indexFile, JSON.stringify(entries, null, 2), "utf8");
}

function readReports() {
  ensureFiles();
  const reports = JSON.parse(readFileSync(reportsFile, "utf8")) as FraudReportRecord[];
  return reports.map((report) => ({
    ...report,
    status: report.status || (report.action === "report" ? "sent" : "pending"),
    dispatchMode: report.dispatchMode || (report.action === "report" ? "demo" : "link")
  }));
}

function writeReports(reports: FraudReportRecord[]) {
  ensureFiles();
  writeFileSync(reportsFile, JSON.stringify(reports, null, 2), "utf8");
}

function readAuditLog() {
  ensureFiles();
  return JSON.parse(readFileSync(auditFile, "utf8")) as ReportingAuditLogEntry[];
}

function writeAuditLog(entries: ReportingAuditLogEntry[]) {
  ensureFiles();
  writeFileSync(auditFile, JSON.stringify(entries, null, 2), "utf8");
}

function severityFromTrustScore(trustScore: number): SimilarityIndexEntry["severity"] {
  if (trustScore < 35) return "high";
  if (trustScore < 65) return "medium";
  return "low";
}

function buildPreview(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function ensureSeededSimilarityIndex() {
  const current = readIndex();
  if (current.length) return current;

  const entries: SimilarityIndexEntry[] = [];
  for (const match of seededMatches) {
    const payload = `${match.type}:${match.content}`;
    entries.push({
      id: randomUUID(),
      hash: hashContent(payload),
      type: match.type,
      content: match.content,
      preview: buildPreview(match.content),
      source: match.source,
      url: match.url,
      trustScore: match.trustScore,
      caption: match.caption,
      embedding: await generateEmbedding(match.content, true),
      platforms: match.platforms,
      reportCount: 0,
      severity: severityFromTrustScore(match.trustScore),
      createdAt: new Date().toISOString()
    });
  }

  writeIndex(entries);
  return entries;
}

export async function listSimilarityEntries() {
  const seeded = await ensureSeededSimilarityIndex();
  return seeded.length ? readIndex() : seeded;
}

export async function syncVerificationToSimilarityIndex(record: VerificationRecord) {
  const entries = await listSimilarityEntries();
  const existing = entries.find((entry) => entry.hash === record.hash && entry.source === "TruthChain");

  const nextEntry: SimilarityIndexEntry = {
    id: existing?.id || randomUUID(),
    hash: record.hash,
    type: record.type,
    content: record.sourcePreview,
    preview: buildPreview(record.sourcePreview),
    source: "TruthChain",
    url: `/passport/${record.hash}`,
    trustScore: record.truthScore,
    caption: record.executiveSummary,
    embedding: record.embedding || (await generateEmbedding(record.sourcePreview, true)),
    platforms: ["TruthChain"],
    reportCount: existing?.reportCount || 0,
    severity: severityFromTrustScore(record.truthScore),
    createdAt: existing?.createdAt || record.timestamp
  };

  const nextEntries = [nextEntry, ...entries.filter((entry) => entry.id !== nextEntry.id && !(entry.hash === nextEntry.hash && entry.source === nextEntry.source))].slice(0, 120);
  writeIndex(nextEntries);
  return nextEntry;
}

export async function saveFraudReport(report: Omit<FraudReportRecord, "id" | "createdAt">) {
  const reports = readReports();
  const nextReport: FraudReportRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...report
  };
  writeReports([nextReport, ...reports].slice(0, 300));

  const entries = await listSimilarityEntries();
  const nextEntries = entries.map((entry) =>
    entry.id === report.matchId
      ? {
          ...entry,
          reportCount: entry.reportCount + 1,
          severity: entry.reportCount + 1 > 4 ? "high" : entry.reportCount + 1 > 1 ? "medium" : entry.severity
        }
      : entry
  );
  writeIndex(nextEntries);

  return nextReport;
}

export async function listFraudReports() {
  return readReports();
}

export async function saveReportingAuditEntry(entry: Omit<ReportingAuditLogEntry, "id" | "timestamp">) {
  const entries = readAuditLog();
  const nextEntry: ReportingAuditLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry
  };
  writeAuditLog([nextEntry, ...entries].slice(0, 500));
  return nextEntry;
}

export async function listReportingAuditEntries() {
  return readAuditLog();
}

export async function updateFraudReportStatus(reportId: string, status: FraudReportRecord["status"]) {
  const reports = readReports();
  const nextReports = reports.map((report) => (report.id === reportId ? { ...report, status } : report));
  writeReports(nextReports);
  return nextReports.find((report) => report.id === reportId) || null;
}
