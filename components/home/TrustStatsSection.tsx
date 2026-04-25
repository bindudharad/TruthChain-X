"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Blocks, Radar } from "lucide-react";

const stats = [
  {
    value: "10,000+",
    label: "scans performed",
    detail: "URLs, claims, QR codes, and image submissions",
    icon: Radar
  },
  {
    value: "98%",
    label: "phishing detection accuracy",
    detail: "Signal-based scoring with AI explanation",
    icon: BadgeCheck
  },
  {
    value: "AI + Chain",
    label: "real-time verification",
    detail: "Public source checks with tamper-aware records",
    icon: Blocks
  }
];

export function TrustStatsSection() {
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-4 md:grid-cols-3"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-cyan-300/25 hover:shadow-[0_22px_60px_rgba(14,165,233,0.16)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm font-medium text-cyan-100">{stat.label}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-400">{stat.detail}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
