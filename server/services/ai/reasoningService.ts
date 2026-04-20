import { ProviderContext } from "@/services/ai/shared";
import { reasoningService as execute } from "@/services/ai/reasoningService";
import { withTimeout } from "@/server/utils/with-timeout";

export async function reasoningProcessingService(context: ProviderContext) {
  return withTimeout(execute(context), 12_000, "reasoningService");
}
