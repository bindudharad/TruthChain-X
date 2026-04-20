import { ModelContribution } from "@/lib/types";
import { ProviderContext, tokenSimilarity } from "@/services/ai/shared";
import { gemmaService } from "@/services/ai/gemmaService";
import { groqService } from "@/services/ai/groqService";
import { hfService } from "@/services/ai/hfService";
import { nemotronService } from "@/services/ai/nemotronService";
import { qwenService } from "@/services/ai/qwenService";
import { reasoningService } from "@/services/ai/reasoningService";
import { visualService } from "@/services/ai/visualService";

export async function runEnsemble(context: ProviderContext): Promise<ModelContribution[]> {
  const tasks: Array<Promise<ModelContribution>> = [];
  tasks.push(groqService(context));
  tasks.push(reasoningService(context));
  tasks.push(nemotronService(context));

  if (context.input.type === "text") {
    tasks.push(gemmaService(context));
    if (/source code|smart contract|protocol|python|solidity/i.test(context.preview)) {
      tasks.push(qwenService(context));
    }
  } else {
    tasks.push(hfService(context));
  }

  if (/deepfake|synthetic|manipulated|artifact|mismatch|viral/i.test(context.preview) || context.input.type !== "text") {
    tasks.push(visualService(context));
  }

  return Promise.all(tasks);
}

export { tokenSimilarity };
