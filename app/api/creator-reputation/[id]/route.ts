import { NextResponse } from "next/server";
import { getCreatorProfile, listVerifications } from "@/lib/db";
import { requirePlatformAccess } from "@/lib/platform";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = requirePlatformAccess(request);
  if (access.error) return access.error;

  const { id } = await params;
  const creator = await getCreatorProfile(id);

  if (!creator) {
    return NextResponse.json({ id, found: false, message: "Creator not found." }, { status: 404 });
  }

  const records = (await listVerifications()).filter((record) => record.creatorId === id).slice(0, 10);

  return NextResponse.json({
    id,
    found: true,
    creator,
    history: records.map((record) => ({
      hash: record.hash,
      fileName: record.fileName,
      truthScore: record.truthScore,
      timestamp: record.timestamp
    }))
  });
}
