"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/services/api";

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  level: "info" | "warning" | "danger";
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .get<{ alerts: AlertItem[] }>("/api/alerts")
        .then((data) => {
          if (active) setAlerts(data.alerts || []);
        })
        .catch(() => undefined);

    load();
    const timer = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!alerts.length) return;
    const timer = setTimeout(() => {
      setAlerts((current) => current.slice(0, Math.max(current.length - 1, 1)));
    }, 6000);
    return () => clearTimeout(timer);
  }, [alerts]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]"
      >
        <Bell className="h-5 w-5" />
        {alerts.length ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-400" /> : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="panel absolute right-0 top-14 z-50 w-[min(92vw,360px)] rounded-xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <span className="text-xs text-slate-500">{alerts.length} active</span>
            </div>
            <div className="space-y-2">
              {alerts.length ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{alert.detail}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">No active alerts right now.</div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
