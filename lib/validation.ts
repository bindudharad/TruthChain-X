import { AnalysisInput } from "@/lib/types";

export function validateAnalysisInput(input: Partial<AnalysisInput>) {
  if (!input.type || !["text", "image", "video"].includes(input.type)) {
    return "Invalid or missing content type.";
  }

  if (!input.content || typeof input.content !== "string") {
    return "Missing content payload.";
  }

  if (input.content.length > 2_000_000) {
    return "Content payload is too large for this MVP deployment.";
  }

  return null;
}
