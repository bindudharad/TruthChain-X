import { ProviderContext } from "@/services/ai/shared";
import { groqService as execute } from "@/services/ai/groqService";
import { withTimeout } from "@/server/utils/with-timeout";

export async function groqProcessingService(context: ProviderContext) {
  return withTimeout(execute(context), 8_000, "groqService");
}
