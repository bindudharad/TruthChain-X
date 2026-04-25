"use client";

import { ReactNode, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  title,
  subtitle,
  children,
  trustScore,
  riskLabel,
  userName,
  verified
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  trustScore?: number;
  riskLabel?: string;
  userName?: string;
  verified?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div suppressHydrationWarning className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col lg:pl-[286px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_60%)]" />
        <Navbar
          title={title}
          subtitle={subtitle}
          onOpenMenu={() => setMobileOpen(true)}
          trustScore={trustScore}
          riskLabel={riskLabel}
          userName={userName}
          verified={verified}
        />
        <main suppressHydrationWarning className="min-h-0 flex-1 overflow-y-auto">
          <div suppressHydrationWarning className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 xl:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
