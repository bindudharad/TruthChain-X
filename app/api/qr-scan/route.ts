import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { decodeQRCode } from "@/lib/qr-scanner";
import { analyzeInput } from "@/server/services/trust-analysis/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function extractImagePayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { imageData?: string; mimeType?: string } | null;
    if (!body?.imageData) {
      throw new Error("Upload a QR image or provide imageData.");
    }

    const match = body.imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error("QR imageData must be a valid base64 data URL.");
    }

    return {
      buffer: Buffer.from(match[2], "base64"),
      mimeType: body.mimeType || match[1],
      fileName: "qr-upload"
    };
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    throw new Error("Upload a QR image file.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("QR scan only accepts image uploads.");
  }

  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
    fileName: file.name || "qr-upload"
  };
}

export async function POST(request: Request) {
  try {
    console.log("API HIT");
    const payload = await extractImagePayload(request);
    const decoded = await decodeQRCode(payload.buffer, payload.mimeType);

    if (!decoded.rawData) {
      return NextResponse.json({ error: "QR code could not be decoded." }, { status: 400 });
    }

    console.log("QR data:", decoded.rawData);
    const result = await analyzeInput({
      type: "qr",
      content: decoded.rawData,
      url: decoded.type === "url" ? decoded.rawData : undefined,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      creatorId: "qr-scanner",
      creatorName: "TruthChain-X QR Scanner"
    });

    return NextResponse.json({
      qrContent: decoded.rawData,
      qrType: decoded.type,
      canOpen: decoded.type === "url" && result.score >= 70,
      ...result
    });
  } catch (error) {
    console.error("QR API ERROR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "QR scan failed."
      },
      { status: 500 }
    );
  }
}
