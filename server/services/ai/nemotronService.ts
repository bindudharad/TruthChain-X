import { ProviderContext } from "@/services/ai/shared";
import { nemotronService as execute } from "@/services/ai/nemotronService";
import { withTimeout } from "@/server/utils/with-timeout";

export async function nemotronProcessingService(context: ProviderContext) {
  return withTimeout(execute(context), 8_000, "nemotronService");
}
