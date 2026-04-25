import jsQR from "jsqr";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { QRDecodeResult } from "@/lib/types";

function looksLikeUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim()) || /^www\.\S+/i.test(value.trim());
}

function detectType(value: string): QRDecodeResult["type"] {
  if (!value.trim()) return "unknown";
  if (looksLikeUrl(value)) return "url";
  if (/[a-z0-9]/i.test(value)) return "text";
  return "unknown";
}

function decodePng(buffer: Buffer) {
  const decoded = PNG.sync.read(buffer);
  return {
    data: new Uint8ClampedArray(decoded.data),
    width: decoded.width,
    height: decoded.height
  };
}

function decodeJpeg(buffer: Buffer) {
  const decoded = jpeg.decode(buffer, { useTArray: true });
  return {
    data: new Uint8ClampedArray(decoded.data),
    width: decoded.width,
    height: decoded.height
  };
}

function decodeRaster(buffer: Buffer, mimeType?: string) {
  const header = buffer.subarray(0, 12).toString("hex");

  if (mimeType === "image/png" || header.startsWith("89504e47")) {
    return decodePng(buffer);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg" || header.startsWith("ffd8ff")) {
    return decodeJpeg(buffer);
  }

  throw new Error("Unsupported QR image format. Use PNG or JPEG.");
}

export async function decodeQRCode(image: Buffer, mimeType?: string): Promise<QRDecodeResult> {
  const raster = decodeRaster(image, mimeType);
  const decoded = jsQR(raster.data, raster.width, raster.height, {
    inversionAttempts: "attemptBoth"
  });

  if (!decoded?.data) {
    return {
      rawData: "",
      type: "unknown"
    };
  }

  const rawData = decoded.data.trim();
  return {
    rawData,
    type: detectType(rawData)
  };
}
