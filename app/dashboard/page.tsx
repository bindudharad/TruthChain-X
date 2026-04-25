import ClientOnly from "@/components/utils/ClientOnly";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { buildDashboardSnapshot } from "@/server/services/dashboard/summary";

export default async function DashboardRoutePage() {
  const initialSnapshot = await buildDashboardSnapshot().catch(() => null);

  return (
    <ClientOnly>
      <DashboardPage initialSnapshot={initialSnapshot} />
    </ClientOnly>
  );
}
