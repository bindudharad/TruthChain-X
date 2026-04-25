"use client";

import { motion } from "framer-motion";
import { Database, QrCode, ShieldCheck, Sparkles, Zap } from "lucide-react";

const features = [
  {
    title: "Detect scam links instantly",
    description: "AI identifies phishing patterns before you click.",
    icon: ShieldCheck
  },
  {
    title: "Real-time verification",
    description: "Cross-checks data from trusted sources.",
    icon: Zap
  },
  {
    title: "QR intelligence",
    description: "Analyze hidden risks inside QR codes.",
    icon: QrCode
  },
  {
    title: "AI Trust Score (0-100)",
    description: "Clear score plus explanation in seconds.",
    icon: Sparkles
  },
  {
    title: "Blockchain verification",
    description: "Tamper-proof trust records for critical decisions.",
    icon: Database
  }
];

export function FeaturesSection() {
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Features</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything needed to make trust decisions feel obvious</h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:translate-y-[-4px] hover:scale-[1.02] hover:border-cyan-300/20 hover:shadow-[0_18px_44px_rgba(14,165,233,0.18)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
