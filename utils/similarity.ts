export function tokenSimilarityPercent(a: string, b: string) {
  const tokensA = new Set(a.toLowerCase().split(/[^a-z0-9\u0900-\u097f\u0600-\u06ff]+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/[^a-z0-9\u0900-\u097f\u0600-\u06ff]+/).filter(Boolean));
  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  return Math.round((intersection / union) * 100);
}
