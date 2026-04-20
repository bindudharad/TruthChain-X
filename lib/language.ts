import { AnalysisInput } from "@/lib/types";

const languageLabels: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  es: "Spanish",
  ar: "Arabic",
  mixed: "Mixed"
};

export function detectLanguageSignal(input: Pick<AnalysisInput, "content" | "type">) {
  if (input.type !== "text") {
    return { code: "visual", label: "Visual media", confidence: 100 };
  }

  const text = input.content;
  const lower = text.toLowerCase();

  if (/[\u0900-\u097f]/.test(text)) {
    return { code: "hi", label: languageLabels.hi, confidence: 86 };
  }

  if (/[\u0C80-\u0CFF]/.test(text)) {
    return { code: "kn", label: languageLabels.kn, confidence: 84 };
  }

  if (/[\u0600-\u06ff]/.test(text)) {
    return { code: "ar", label: languageLabels.ar, confidence: 82 };
  }

  if (/\b(el|la|los|las|una|urgente|comparte|falso)\b/.test(lower)) {
    return { code: "es", label: languageLabels.es, confidence: 78 };
  }

  if (/[A-Za-z]/.test(text)) {
    return { code: "en", label: languageLabels.en, confidence: 74 };
  }

  return { code: "mixed", label: languageLabels.mixed, confidence: 52 };
}
