import { CreatorProfile } from "@/lib/types";
import { createBaseCreatorProfile, normalizeCreatorId, updateCreatorReputation } from "@/lib/reputation";
import { getCreatorProfile, saveCreatorProfile } from "@/lib/db";

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
  return next;
}
