import mongoose, { Schema, model, models } from "mongoose";
import { CreatorProfile } from "@/lib/types";

export type UserDocument = CreatorProfile & { createdAt?: Date; updatedAt?: Date };

const UserSchema = new Schema<UserDocument>(
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

export const UserModel = (models.CreatorProfile as mongoose.Model<UserDocument>) || model<UserDocument>("CreatorProfile", UserSchema);
