import { ProviderContext } from "@/services/ai/shared";
import { hfService as execute } from "@/services/ai/hfService";
import { withTimeout } from "@/server/utils/with-timeout";

export async function hfProcessingService(context: ProviderContext) {
  return withTimeout(execute(context), 12_000, "hfService");
}
