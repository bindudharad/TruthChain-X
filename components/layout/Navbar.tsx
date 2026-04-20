"use client";

import { Menu, UserCircle2 } from "lucide-react";
import { NotificationBell } from "@/components/features/trust/NotificationBell";

export function Navbar({ title, subtitle, onOpenMenu }: { title: string; subtitle: string; onOpenMenu?: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07101d]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-white/10 p-2 lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</p>
            <p className="text-xs text-slate-400 sm:text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 md:block">Enterprise ready</div>
          <NotificationBell />
          <button className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:scale-105 hover:border-cyan-400/40">
            <UserCircle2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
