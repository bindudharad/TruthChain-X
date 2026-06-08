"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Search, ShieldCheck, UserRound } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home", description: "Product overview" },
  { href: "/analyze", icon: Search, label: "Analysis", description: "Scan content" },
  { href: "/dashboard", icon: BarChart3, label: "Dashboard", description: "History and status" }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/analyze" && pathname.startsWith("/analysis"));
}

export function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("sidebar-scroll");
    if (saved && sidebarRef.current) {
      sidebarRef.current.scrollTop = Number.parseInt(saved, 10) || 0;
    }
  }, []);

  useEffect(() => {
    const activeEl = sidebarRef.current?.querySelector(".active-nav");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [pathname]);

  function handleScroll() {
    if (sidebarRef.current) {
      window.sessionStorage.setItem("sidebar-scroll", String(sidebarRef.current.scrollTop));
    }
  }

  return (
    <aside
      className={`panel fixed inset-y-0 left-0 z-[60] h-screen w-[286px] flex-col border-r border-white/10 transition-transform lg:flex ${
        mobileOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:translate-x-0"
      }`}
    >
      <div ref={sidebarRef} onScroll={handleScroll} className="flex h-full min-h-0 flex-col overflow-y-auto scroll-smooth">
        <div className="p-4 pb-3">
          <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(56,189,248,0.18)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">TruthChain-X</p>
              <p className="truncate text-xs text-slate-400">Security analysis platform</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-3">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group active-indicator relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] ${
                  active
                    ? "active-nav border border-white/10 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-white shadow-[0_0_15px_rgba(56,189,248,0.32)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`absolute left-0 top-2 h-[calc(100%-1rem)] w-[3px] rounded-r ${active ? "bg-cyan-300" : "bg-transparent"}`} />
                <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <div className="min-w-0">
                  <p className={`truncate text-sm ${active ? "font-medium text-white" : "font-normal"}`}>{item.label}</p>
                  <p className="truncate text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 p-4">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/8 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
              <div>
                <p className="text-sm font-medium text-white">Secure analysis</p>
                <p className="text-xs text-slate-400">Privacy-focused scanning.</p>
              </div>
            </div>
          </div>
          <Link
            href="/profile"
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] ${
              pathname.startsWith("/profile") ? "active-nav border border-white/10 bg-white/10 text-white shadow-[0_0_15px_rgba(56,189,248,0.28)]" : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <UserRound className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">Profile / Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
