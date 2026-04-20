import { AnalysisInput } from "@/lib/types";
import { validateAnalysisInput } from "@/lib/validation";

export function validateAnalyzeRequest(input: Partial<AnalysisInput>) {
  return validateAnalysisInput(input);
}
