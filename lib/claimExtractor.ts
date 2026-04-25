import { AnalysisInput, ClaimCategory, ClaimType, ExtractedClaim } from "@/lib/types";

const PUBLIC_FIGURE_PATTERN =
  /\b(leader|president|prime minister|chief minister|cm|minister|celebrity|actor|cricketer|ceo|elon musk|trump|modi|biden|virat kohli|putin|zelenskyy)\b/i;
const POLITICS_PATTERN = /\b(election|policy|government|parliament|campaign|political|minister|chief minister|cm|vote|party|cabinet|bill)\b/i;
const HEALTH_PATTERN = /\b(health|disease|virus|vaccine|cure|treatment|doctor|hospital|medicine|infection|outbreak)\b/i;
const MAJOR_EVENT_PATTERN = /\b(world cup|earthquake|war|summit|championship|attack|disaster|final|riot|married|marriage|death|launched|announced)\b/i;
const CLAIM_TRIGGER_PATTERN =
  /\b(announced|launched|married|died|won|lost|approved|banned|secretly|confirmed|reported|claim|claims|say|says|according to|visiting|visited)\b/i;
const LOCATION_PATTERN =
  /\b(tumkur|tumakuru|bangalore|bengaluru|karnataka|india|delhi|mumbai|chennai|mysore|mysuru|district|state|country|capital)\b/i;
const SCIENTIFIC_PATTERN =
  /\b(water|earth|sun|moon|gravity|oxygen|science|scientific|planet|poisonous|boils|freezes)\b/i;
const FACTUAL_STATEMENT_PATTERN = /\b(is|are|was|were|has|have|will|can|cannot|not)\b/i;

function categoriesFor(text: string): ClaimCategory[] {
  const categories: ClaimCategory[] = [];
  if (PUBLIC_FIGURE_PATTERN.test(text)) categories.push("public-figure");
  if (POLITICS_PATTERN.test(text)) categories.push("politics");
  if (HEALTH_PATTERN.test(text)) categories.push("health");
  if (MAJOR_EVENT_PATTERN.test(text)) categories.push("major-event");
  return categories;
}

function normalizeClaim(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function classifyClaim(claim: string): ClaimType {
  const text = normalizeClaim(claim).toLowerCase();

  if (HEALTH_PATTERN.test(text)) return "health";
  if (LOCATION_PATTERN.test(text)) return "location";
  if (POLITICS_PATTERN.test(text) || MAJOR_EVENT_PATTERN.test(text) || PUBLIC_FIGURE_PATTERN.test(text)) return "news/event";
  if (SCIENTIFIC_PATTERN.test(text)) return "scientific";
  return "general";
}

export function extractClaims(input: Pick<AnalysisInput, "content" | "url"> | string): ExtractedClaim[] {
  const raw = typeof input === "string" ? input : `${input.content || ""} ${input.url || ""}`;
  const text = normalizeClaim(raw);
  if (!text) return [];

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalizeClaim)
    .filter(Boolean)
    .slice(0, 8);

  const extracted = sentences
    .map((sentence) => {
      const categories = categoriesFor(sentence);
      const type = classifyClaim(sentence);
      const highVerificationRequired = categories.length > 0 || CLAIM_TRIGGER_PATTERN.test(sentence) || type === "scientific" || type === "location" || FACTUAL_STATEMENT_PATTERN.test(sentence);
      if (!highVerificationRequired) return null;

      return {
        text: sentence.slice(0, 180),
        type,
        categories,
        highVerificationRequired
      } satisfies ExtractedClaim;
    })
    .filter(Boolean) as ExtractedClaim[];

  if (extracted.length) return extracted;

  const fallbackCategories = categoriesFor(text);
  const fallbackType = classifyClaim(text);
  if (!fallbackCategories.length && !CLAIM_TRIGGER_PATTERN.test(text) && fallbackType === "general" && !FACTUAL_STATEMENT_PATTERN.test(text)) {
    return [];
  }

  return [
    {
      text: text.slice(0, 180),
      type: fallbackType,
      categories: fallbackCategories,
      highVerificationRequired: true
    }
  ];
}
