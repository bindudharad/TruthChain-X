import { AnalysisInput } from "@/lib/types";

export function validateAnalysisInput(input: Partial<AnalysisInput>) {
  if (!input.type || !["text", "image", "video"].includes(input.type)) {
    return "Invalid or missing content type.";
  }

  const hasContent = typeof input.content === "string" && input.content.trim().length > 0;
  const hasUrl = typeof input.url === "string" && input.url.trim().length > 0;
  const hasImageUrl = typeof input.imageUrl === "string" && input.imageUrl.trim().length > 0;
  const hasVideoUrl = typeof input.videoUrl === "string" && input.videoUrl.trim().length > 0;

  if (!hasContent && !hasUrl && !hasImageUrl && !hasVideoUrl) {
    return "Provide a URL, content payload, image URL, video URL, or a combination of them.";
  }

  if (hasContent && input.content!.length > 2_000_000) {
    return "Content payload is too large for this MVP deployment.";
  }

  if (hasUrl && input.url!.length > 2048) {
    return "URL is too long for this phishing scan.";
  }

  if (hasImageUrl && input.imageUrl!.length > 4096) {
    return "Image URL is too long for this scan.";
  }

  if (hasVideoUrl && input.videoUrl!.length > 4096) {
    return "Video URL is too long for this scan.";
  }

  return null;
}
