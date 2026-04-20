import mongoose, { Schema, model, models } from "mongoose";
import { VerificationRecord } from "@/lib/types";

export type TrustResultDocument = VerificationRecord & { createdAt?: Date; updatedAt?: Date };

const TrustResultSchema = new Schema<TrustResultDocument>(
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

export const TrustResultModel = (models.Verification as mongoose.Model<TrustResultDocument>) || model<TrustResultDocument>("Verification", TrustResultSchema);
