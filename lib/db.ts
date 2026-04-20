import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import mongoose, { Schema, model, models } from "mongoose";
import { normalizeCreatorId } from "@/lib/reputation";
import { CreatorProfile, TrendingAlert, VerificationRecord } from "@/lib/types";

const dataDir = join(process.cwd(), "data");
const dataFile = join(dataDir, "verifications.json");
const creatorsFile = join(dataDir, "creators.json");

type RecordDocument = VerificationRecord & { createdAt?: Date; updatedAt?: Date };
type CreatorDocument = CreatorProfile & { createdAt?: Date; updatedAt?: Date };

const VerificationSchema = new Schema<RecordDocument>(
  {
    id: { type: String, required: true, unique: true },
    hash: { type: String, required: true, index: true },
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    creatorId: { type: String, required: true, index: true },
    creatorProfile: { type: Schema.Types.Mixed, required: true },
    embedding: [{ type: Number }],
    truthScore: { type: Number, required: true },
    confidence: { type: Number, required: true },
    executiveSummary: { type: String, required: true },
    explanation: { type: String, required: true },
    findings: [{ type: String }],
    suspiciousSignals: [{ type: String }],
    detectedClaims: [{ type: String }],
    modelBreakdown: [{ type: Schema.Types.Mixed }],
    preprocessing: { type: Schema.Types.Mixed, required: true },
    consensus: { type: Schema.Types.Mixed, required: true },
    trustFingerprint: { type: Schema.Types.Mixed, required: true },
    trustGraph: [{ type: Schema.Types.Mixed }],
    viralSignal: { type: Schema.Types.Mixed, required: true },
    comparisonVisuals: [{ type: Schema.Types.Mixed }],
    timestamp: { type: String, required: true },
    firstVerifiedAt: { type: String, required: true },
    lastVerifiedAt: { type: String, required: true },
    occurrenceCount: { type: Number, required: true },
    previouslyVerified: { type: Boolean, required: true },
    blockchainStatus: { type: String, required: true },
    transactionHash: { type: String, required: true },
    sourcePreview: { type: String, required: true }
  },
  { timestamps: true }
);

const VerificationModel = models.Verification || model<RecordDocument>("Verification", VerificationSchema);
const CreatorSchema = new Schema<CreatorDocument>(
  {
    creatorId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    credibilityScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    verifiedBadge: { type: Boolean, required: true },
    totalUploads: { type: Number, required: true },
    verifiedCount: { type: Number, required: true },
    flaggedCount: { type: Number, required: true },
    contentHistory: [{ type: String }],
    historySummary: { type: String, required: true },
    blockchainIdentityId: { type: String, required: true },
    identityStatus: { type: String, required: true }
  },
  { timestamps: true }
);
const CreatorModel = models.CreatorProfile || model<CreatorDocument>("CreatorProfile", CreatorSchema);

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;
  if (mongoose.connection.readyState === 1) return true;
  await mongoose.connect(uri);
  return true;
}

function ensureDataFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dataFile)) writeFileSync(dataFile, "[]", "utf8");
  if (!existsSync(creatorsFile)) writeFileSync(creatorsFile, "[]", "utf8");
}

function readLocalRecords(): VerificationRecord[] {
  ensureDataFile();
  return JSON.parse(readFileSync(dataFile, "utf8")) as VerificationRecord[];
}

function writeLocalRecords(records: VerificationRecord[]) {
  ensureDataFile();
  writeFileSync(dataFile, JSON.stringify(records, null, 2), "utf8");
}

function readLocalCreators(): CreatorProfile[] {
  ensureDataFile();
  return JSON.parse(readFileSync(creatorsFile, "utf8")) as CreatorProfile[];
}

function writeLocalCreators(creators: CreatorProfile[]) {
  ensureDataFile();
  writeFileSync(creatorsFile, JSON.stringify(creators, null, 2), "utf8");
}

function mergeCreatorProfiles(profiles: CreatorProfile[]) {
  return profiles.reduce<CreatorProfile[]>((merged, profile) => {
    const normalizedId = normalizeCreatorId(profile.creatorId);
    const existingIndex = merged.findIndex((item) => item.creatorId === normalizedId);
    const normalizedProfile = {
      ...profile,
      creatorId: normalizedId,
      blockchainIdentityId: profile.blockchainIdentityId || normalizedId.toUpperCase()
    };

    if (existingIndex === -1) {
      merged.push(normalizedProfile);
      return merged;
    }

    const existing = merged[existingIndex];
    const credibilityScore = Math.round((existing.credibilityScore + normalizedProfile.credibilityScore) / 2);
    const verifiedCount = existing.verifiedCount + normalizedProfile.verifiedCount;
    const flaggedCount = existing.flaggedCount + normalizedProfile.flaggedCount;
    const totalUploads = Math.max(existing.totalUploads, normalizedProfile.totalUploads, verifiedCount + flaggedCount);

    merged[existingIndex] = {
      ...existing,
      displayName: existing.displayName.length >= normalizedProfile.displayName.length ? existing.displayName : normalizedProfile.displayName,
      credibilityScore,
      riskLevel: credibilityScore < 40 ? "high" : credibilityScore < 70 ? "medium" : "low",
      verifiedBadge: existing.verifiedBadge || normalizedProfile.verifiedBadge,
      totalUploads,
      verifiedCount,
      flaggedCount,
      contentHistory: [...new Set([...existing.contentHistory, ...normalizedProfile.contentHistory])].slice(0, 8),
      historySummary:
        flaggedCount > verifiedCount
          ? `${existing.displayName} has a risky publishing pattern with more flagged than trusted submissions.`
          : verifiedCount > 0
            ? `${existing.displayName} has ${verifiedCount} trusted items and ${flaggedCount} flagged items on record.`
            : `${existing.displayName} is still building credibility across early submissions.`,
      blockchainIdentityId: existing.blockchainIdentityId || normalizedProfile.blockchainIdentityId,
      identityStatus: existing.identityStatus === "confirmed" || normalizedProfile.identityStatus === "confirmed" ? "confirmed" : normalizedProfile.identityStatus
    };
    return merged;
  }, []);
}

export async function saveVerification(record: VerificationRecord) {
  const nowIso = new Date().toISOString();
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    const existing = await VerificationModel.findOne({ hash: record.hash }).lean<RecordDocument | null>();
    const merged = existing
      ? {
          ...record,
          id: existing.id,
          firstVerifiedAt: existing.firstVerifiedAt,
          lastVerifiedAt: nowIso,
          occurrenceCount: (existing.occurrenceCount || 1) + 1,
          previouslyVerified: true
        }
      : record;
    await VerificationModel.findOneAndUpdate({ hash: record.hash }, merged, { upsert: true, new: true });
    return normalizeRecord(merged);
  }

  const records = readLocalRecords();
  const existing = records.find((item) => item.hash === record.hash);
  const merged = existing
    ? {
        ...record,
        id: existing.id,
        firstVerifiedAt: existing.firstVerifiedAt,
        lastVerifiedAt: nowIso,
        occurrenceCount: existing.occurrenceCount + 1,
        previouslyVerified: true
      }
    : record;
  const nextRecords = [merged, ...records.filter((item) => item.hash !== record.hash)].slice(0, 80);
  writeLocalRecords(nextRecords);
  return merged;
}

export async function findVerificationByHash(hash: string) {
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    const mongoRecord = await VerificationModel.findOne({ hash }).lean<RecordDocument | null>();
    if (mongoRecord) return normalizeRecord(mongoRecord);
  }
  return readLocalRecords().find((item) => item.hash === hash) || null;
}

export async function listVerifications() {
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    const mongoRecords = await VerificationModel.find().sort({ updatedAt: -1 }).limit(24).lean<RecordDocument[]>();
    if (mongoRecords.length) return mongoRecords.map(normalizeRecord);
  }
  return readLocalRecords().slice(0, 24);
}

export async function getCreatorProfile(creatorId: string) {
  const normalizedId = normalizeCreatorId(creatorId);
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    const creators = await CreatorModel.find({ creatorId: { $in: [creatorId, normalizedId] } }).lean<CreatorDocument[]>();
    if (creators.length) return mergeCreatorProfiles(creators.map(normalizeCreator))[0] || null;
  }

  return mergeCreatorProfiles(readLocalCreators().filter((creator) => normalizeCreatorId(creator.creatorId) === normalizedId))[0] || null;
}

export async function saveCreatorProfile(profile: CreatorProfile) {
  const normalizedProfile = {
    ...profile,
    creatorId: normalizeCreatorId(profile.creatorId)
  };
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    await CreatorModel.findOneAndUpdate({ creatorId: normalizedProfile.creatorId }, normalizedProfile, { upsert: true, new: true });
    return normalizedProfile;
  }

  const creators = readLocalCreators();
  const next = [normalizedProfile, ...creators.filter((creator) => normalizeCreatorId(creator.creatorId) !== normalizedProfile.creatorId)].slice(0, 60);
  writeLocalCreators(next);
  return normalizedProfile;
}

export async function listCreatorProfiles() {
  const hasMongo = await connectMongo().catch(() => false);
  if (hasMongo) {
    const creators = await CreatorModel.find().sort({ updatedAt: -1 }).limit(20).lean<CreatorDocument[]>();
    if (creators.length) return mergeCreatorProfiles(creators.map(normalizeCreator));
  }

  return mergeCreatorProfiles(readLocalCreators()).slice(0, 20);
}

export function buildTrendingAlerts(records: VerificationRecord[]): TrendingAlert[] {
  const dynamicAlerts = records
    .filter((record) => record.viralSignal.trendingScore >= 40)
    .slice(0, 4)
    .map((record) => ({
      id: record.id,
      label: record.fileName,
      riskLevel: (record.truthScore < 35 ? "critical" : record.truthScore < 50 ? "high" : "moderate") as TrendingAlert["riskLevel"],
      region: record.type === "video" ? "Global video channels" : record.type === "image" ? "Image-sharing networks" : "Messaging apps",
      volume: record.viralSignal.trendingScore,
      category: `${record.type[0].toUpperCase()}${record.type.slice(1)} cluster`
    }));

  return dynamicAlerts.length
    ? dynamicAlerts
    : [
        {
          id: "fallback-alert",
          label: "Emerging misinformation cluster",
          riskLevel: "moderate",
          region: "Cross-platform",
          volume: 52,
          category: "Narrative Watch"
        }
      ];
}

function normalizeRecord(record: RecordDocument): VerificationRecord {
  return {
    id: record.id,
    hash: record.hash,
    type: record.type,
    fileName: record.fileName,
    creatorId: record.creatorId,
    creatorProfile: record.creatorProfile,
    embedding: record.embedding,
    truthScore: record.truthScore,
    confidence: record.confidence,
    executiveSummary: record.executiveSummary,
    explanation: record.explanation,
    findings: record.findings,
    suspiciousSignals: record.suspiciousSignals,
    detectedClaims: record.detectedClaims,
    modelBreakdown: record.modelBreakdown,
    preprocessing: record.preprocessing,
    consensus: record.consensus,
    trustFingerprint: record.trustFingerprint,
    trustGraph: record.trustGraph,
    viralSignal: record.viralSignal,
    comparisonVisuals: record.comparisonVisuals,
    timestamp: record.timestamp,
    firstVerifiedAt: record.firstVerifiedAt,
    lastVerifiedAt: record.lastVerifiedAt,
    occurrenceCount: record.occurrenceCount,
    previouslyVerified: record.previouslyVerified,
    blockchainStatus: record.blockchainStatus,
    transactionHash: record.transactionHash,
    sourcePreview: record.sourcePreview
  };
}

function normalizeCreator(creator: CreatorDocument): CreatorProfile {
  return {
    creatorId: creator.creatorId,
    displayName: creator.displayName,
    credibilityScore: creator.credibilityScore,
    riskLevel: creator.riskLevel,
    verifiedBadge: creator.verifiedBadge,
    totalUploads: creator.totalUploads,
    verifiedCount: creator.verifiedCount,
    flaggedCount: creator.flaggedCount,
    contentHistory: creator.contentHistory,
    historySummary: creator.historySummary,
    blockchainIdentityId: creator.blockchainIdentityId,
    identityStatus: creator.identityStatus
  };
}
