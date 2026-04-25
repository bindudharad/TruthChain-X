"use client";

import { useMemo, useState } from "react";
import { Bell, FileUp, History, LayoutDashboard, Menu, Settings, ShieldAlert, UserCircle2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload", icon: FileUp },
  { id: "history", label: "History", icon: History },
  { id: "alerts", label: "Alerts", icon: ShieldAlert },
  { id: "settings", label: "Settings", icon: Settings }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useMemo(
    () => (
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="panel fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col justify-between rounded-r-lg px-4 py-6 lg:flex"
      >
        <div className="space-y-4">
          <div className="mb-8 flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-semibold">
            TC
          </div>
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.06, x: 4 }}
              className="group relative flex h-12 w-12 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
            >
              <item.icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-md border border-white/10 bg-slate-950 px-3 py-1 text-xs text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
        <div className="rounded-lg border border-white/8 bg-white/5 p-3 text-center text-[11px] text-slate-400">
          Live chain
        </div>
      </motion.aside>
    ),
    []
  );

  return (
    <div className="min-h-screen">
      {sidebar}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          >
            <motion.div initial={{ x: -40 }} animate={{ x: 0 }} exit={{ x: -40 }} className="panel h-full w-72 rounded-r-lg p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">TruthChain-X</p>
                  <p className="text-sm text-slate-400">Real-time phishing defense layer</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg border border-white/10 p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/5 px-4 py-3 text-left text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="lg:pl-[104px]">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07101d]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-white/10 p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-lg font-semibold tracking-tight sm:text-xl">TruthChain-X</p>
                <p className="text-xs text-slate-400 sm:text-sm">Real-Time Phishing Detection System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                <Bell className="h-5 w-5" />
              </button>
              <button className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:scale-105 hover:border-cyan-400/40">
                <UserCircle2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className={clsx("mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10")}>{children}</main>
      </div>
    </div>
  );
}
