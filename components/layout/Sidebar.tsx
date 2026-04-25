"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  QrCode,
  Radar,
  ScanSearch,
  Search,
  Shield,
  Sparkles,
  UserRound
} from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    label: "Core Workflow",
    items: [
      { id: "dashboard", href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", description: "Overview and alerts" },
      { id: "analyze", href: "/analyze", icon: ScanSearch, label: "Analyze", description: "Run phishing scans" },
      { id: "qr-scan", href: "/qr-scan", icon: QrCode, label: "QR Scan", description: "Decode and inspect QR content" },
      { id: "similarity", href: "/similarity", icon: Search, label: "Similarity", description: "Match scam variants" },
      { id: "reports", href: "/reports", icon: ClipboardList, label: "Reports", description: "Review and bulk actions" }
    ]
  },
  {
    label: "Supporting Views",
    items: [
      { id: "copilot", href: "/copilot", icon: Bot, label: "Copilot", description: "AI guidance" },
      { id: "intelligence", href: "/intelligence", icon: Radar, label: "Spread", description: "Spread and prediction" },
      { id: "profile", href: "/profile", icon: UserRound, label: "Profile", description: "Identity and permissions" }
    ]
  }
];

export function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`panel fixed inset-y-0 left-0 z-[60] h-screen overflow-y-auto w-[286px] flex-col border-r border-white/10 transition-transform lg:flex ${
        mobileOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="p-4 pb-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(56,189,248,0.28)]">
                TC
              </div>
              <div>
                <p className="text-sm font-semibold text-white">TruthChain-X</p>
                <p className="text-xs text-slate-400">Real-time phishing defense workspace</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Mode</p>
                <p className="mt-2 text-sm font-medium text-white">Phishing Review</p>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">Status</p>
                <p className="mt-2 text-sm font-medium text-cyan-50">Secure Live</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200">Verified Signals</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">Risk Signature</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-3 px-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{section.label}</p>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const active = pathname === item.href;

                    return (
                      <motion.div key={item.id} whileHover={{ scale: 1.01, x: 3 }}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-slate-200 transition ${
                            active
                              ? "border-cyan-400/40 bg-cyan-400/12 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                              : "border-white/8 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-cyan-400/8"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                              active
                                ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-100"
                                : "border-white/10 bg-slate-950/40 text-slate-300 group-hover:border-cyan-300/20 group-hover:text-cyan-100"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{item.label}</p>
                            <p className="truncate text-xs text-slate-400">{item.description}</p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Audit integrity</p>
              <p className="text-xs text-slate-400">Immutable verification trail active.</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Permission network</p>
              <p className="truncate text-xs text-slate-400">Identity, reporting, and secure action controls.</p>
            </div>
          </div>
        </div>
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/8 hover:text-white"
        >
          <UserRound className="h-4 w-4" />
          Profile & Access
        </Link>
      </div>
    </aside>
  );
}
