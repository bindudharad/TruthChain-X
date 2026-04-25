import { CreatorProfile } from "@/lib/types";
import { createBaseCreatorProfile, normalizeCreatorId, updateCreatorReputation } from "@/lib/reputation";
import { getCreatorProfile, saveCreatorProfile } from "@/lib/db";
import { updateUserTrustScore } from "@/server/services/identity/auth";

export async function getUserProfile(userId: string) {
  return getCreatorProfile(normalizeCreatorId(userId));
}

export async function applyReputationUpdate(params: {
  creatorId: string;
  creatorName: string;
  hash: string;
  truthScore: number;
  fileName: string;
  confirmedIdentity: boolean;
}): Promise<CreatorProfile> {
  const creatorId = normalizeCreatorId(params.creatorId);
  const existing = await getCreatorProfile(creatorId);
  const next = updateCreatorReputation(
    existing || createBaseCreatorProfile(creatorId, params.creatorName, params.confirmedIdentity),
    { hash: params.hash, truthScore: params.truthScore, fileName: params.fileName }
  );
  await saveCreatorProfile(next);
  updateUserTrustScore({
    userId: creatorId,
    truthDelta: params.truthScore >= 70 ? 6 : params.truthScore < 40 ? -8 : 1,
    suspiciousBehavior: params.truthScore < 25,
    contentHash: params.hash
  });
  return next;
}
