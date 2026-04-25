export type SpamCategory = "Safe" | "Suspicious" | "Risk";
export type SpamColor = "green" | "yellow" | "red";

export function getCategory(score: number): SpamCategory {
  if (score <= 30) return "Safe";
  if (score <= 70) return "Suspicious";
  return "Risk";
}

export function getColor(category: SpamCategory): SpamColor {
  if (category === "Safe") return "green";
  if (category === "Suspicious") return "yellow";
  return "red";
}
