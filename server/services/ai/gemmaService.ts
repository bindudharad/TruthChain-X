import { ProviderContext } from "@/services/ai/shared";
import { gemmaService as execute } from "@/services/ai/gemmaService";
import { withTimeout } from "@/server/utils/with-timeout";

export async function gemmaProcessingService(context: ProviderContext) {
  return withTimeout(execute(context), 8_000, "gemmaService");
}
