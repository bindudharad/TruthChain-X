"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, ShieldCheck, UserCircle2 } from "lucide-react";
import { NotificationBell } from "@/components/features/trust/NotificationBell";
import { Badge } from "@/components/ui/Badge";

function trustTone(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 45) return "warning" as const;
  return "danger" as const;
}

export function Navbar({
  title,
  subtitle,
  onOpenMenu,
  trustScore = 82,
  riskLabel = "Low Risk",
  userName = "Operations User",
  verified = true
}: {
  title: string;
  subtitle: string;
  onOpenMenu?: () => void;
  trustScore?: number;
  riskLabel?: string;
  userName?: string;
  verified?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const roundedScore = useMemo(() => Math.max(0, Math.min(100, Math.round(trustScore))), [trustScore]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();

    if (!normalized) return;
    if (normalized.includes("similar")) {
      router.push("/similarity");
      return;
    }
    if (normalized.includes("qr")) {
      router.push("/qr-scan");
      return;
    }
    if (normalized.includes("analy") || normalized.includes("scan") || normalized.includes("upload")) {
      router.push("/analyze");
      return;
    }
    if (normalized.includes("report")) {
      router.push("/reports");
      return;
    }
    if (normalized.includes("copilot")) {
      router.push("/copilot");
      return;
    }
    if (normalized.includes("intel")) {
      router.push("/intelligence");
      return;
    }
    if (normalized.includes("profile") || normalized.includes("identity") || normalized.includes("access")) {
      router.push("/profile");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07101d]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button className="rounded-lg border border-white/10 p-2 lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</p>
              <Badge tone="info" className="hidden sm:inline-flex">Secure Workspace</Badge>
            </div>
            <p className="text-xs text-slate-400 sm:text-sm">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="order-3 w-full lg:order-none lg:max-w-xl lg:flex-1">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-cyan-400/35 focus-within:shadow-[0_0_0_1px_rgba(56,189,248,0.16),0_0_28px_rgba(56,189,248,0.12)]">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, scans, reports, Copilot, or profile"
              className="h-full w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <span className="hidden rounded-lg border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500 md:inline-flex">
              Enter
            </span>
          </label>
        </form>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Risk posture</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{roundedScore}%</span>
                <Badge tone={trustTone(roundedScore)} className="px-2.5 py-0.5">
                  {riskLabel}
                </Badge>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <NotificationBell />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userName}</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                {verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Review</Badge>}
                <span className="text-xs text-slate-400">Profile</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:scale-105 hover:border-cyan-400/40"
            >
              <UserCircle2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
