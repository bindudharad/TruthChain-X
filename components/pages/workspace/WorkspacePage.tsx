"use client";

import { ReactNode, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyzeResponse, DashboardContextValue, DashboardStateProvider, useDashboardState } from "@/hooks/useDashboardState";
import { DashboardSnapshot } from "@/lib/types";

function WorkspaceContent({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: (state: DashboardContextValue) => ReactNode;
}) {
  const state = useDashboardState();

  useEffect(() => {
    state.refresh().catch(() => undefined);
  }, [state.refresh]);

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      trustScore={state.result?.creator.credibilityScore}
      riskLabel={state.result ? (state.result.creator.riskLevel === "high" ? "High Risk" : state.result.creator.riskLevel === "medium" ? "Medium Risk" : "Low Risk") : undefined}
      userName={state.result?.creator.displayName}
      verified={state.result?.creator.verifiedBadge}
    >
      {children(state)}
    </AppShell>
  );
}

export function WorkspacePage({
  title,
  subtitle,
  initialSnapshot,
  children
}: {
  title: string;
  subtitle: string;
  initialSnapshot?: DashboardSnapshot | null;
  children: (state: DashboardContextValue) => ReactNode;
}) {
  return (
    <DashboardStateProvider initialSnapshot={initialSnapshot}>
      <WorkspaceContent title={title} subtitle={subtitle}>
        {children}
      </WorkspaceContent>
    </DashboardStateProvider>
  );
}
