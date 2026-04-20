"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, KeyRound, LayoutDashboard, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { id: "dashboard", href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { id: "analytics", href: "/analytics", icon: BarChart3, label: "Analytics" },
  { id: "reports", href: "/reports", icon: Activity, label: "Reports" },
  { id: "api-hub", href: "/api-hub", icon: KeyRound, label: "API Hub" },
  { id: "trust-score", href: "/dashboard", icon: ShieldCheck, label: "Ops View" }
];

export function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`panel fixed inset-y-0 left-0 z-[60] w-[88px] flex-col justify-between rounded-r-lg px-4 py-6 transition-transform lg:flex ${
        mobileOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="space-y-4">
        <div className="mb-8 flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white">
          TX
        </div>
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.06, x: 4 }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-lg border text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 ${
                pathname === item.href ? "border-cyan-400/50 bg-cyan-400/12" : "border-white/8 bg-white/5"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-md border border-white/10 bg-slate-950 px-3 py-1 text-xs text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="rounded-lg border border-white/8 bg-white/5 p-3 text-center text-[11px] text-slate-400">Trust layer live</div>
    </aside>
  );
}
