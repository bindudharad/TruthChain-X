import mongoose, { Schema, model, models } from "mongoose";

export type ScanDocument = {
  input: string;
  inputType?: string;
  score: number;
  category: string;
  claimStatus: string;
  reasons: string[];
  sources: Array<{
    title?: string;
    url?: string;
    source?: string;
  }>;
  transactionHash?: string;
  blockchainStatus?: string;
  userId?: string;
  createdAt: Date;
};

const ScanSchema = new Schema<ScanDocument>(
  {
    input: { type: String, required: true, index: true },
    inputType: { type: String },
    score: { type: Number, required: true },
    category: { type: String, required: true },
    claimStatus: { type: String, required: true },
    reasons: [{ type: String }],
    sources: [{ type: Schema.Types.Mixed }],
    transactionHash: { type: String },
    blockchainStatus: { type: String },
    userId: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Scan = (models.Scan as mongoose.Model<ScanDocument>) || model<ScanDocument>("Scan", ScanSchema);
