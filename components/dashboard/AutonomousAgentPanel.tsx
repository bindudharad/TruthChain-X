"use client";

import { motion } from "framer-motion";

type AgentAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "watch" | "critical";
};

export function AutonomousAgentPanel({ alerts }: { alerts: AgentAlert[] }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="panel rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">AI Autonomous Agent</p>
          <p className="text-sm text-slate-400">Simulated always-on monitoring that scans incoming narratives and raises alerts.</p>
        </div>
        <motion.div animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="h-3 w-3 rounded-full bg-cyan-400" />
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-100">{alert.title}</p>
                <p className="mt-2 text-sm text-slate-300">{alert.detail}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs ${alert.severity === "critical" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
