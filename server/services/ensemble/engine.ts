import { AnalysisInput, ModelContribution, VerificationRecord } from "@/lib/types";
import { ProviderContext } from "@/services/ai/shared";
import { gemmaProcessingService } from "@/server/services/ai/gemmaService";
import { groqProcessingService } from "@/server/services/ai/groqService";
import { hfProcessingService } from "@/server/services/ai/hfService";
import { nemotronProcessingService } from "@/server/services/ai/nemotronService";
import { reasoningProcessingService } from "@/server/services/ai/reasoningService";
import { buildWeightedSummary } from "@/services/ensemble";

export async function runAiOrchestration(input: AnalysisInput, history: VerificationRecord[] = []): Promise<ModelContribution[]> {
  const context: ProviderContext = {
    input,
    preview: input.content.slice(0, 220),
    history
  };

  const tasks: Array<Promise<ModelContribution>> = [groqProcessingService(context), reasoningProcessingService(context), nemotronProcessingService(context)];
  if (input.type === "text") {
    tasks.push(gemmaProcessingService(context));
  } else {
    tasks.push(hfProcessingService(context));
  }

  return Promise.all(tasks);
}

export function buildEnsembleSummary(models: ModelContribution[], similarMatches: number, explanation: string) {
  return buildWeightedSummary(models, similarMatches, explanation);
}
