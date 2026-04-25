"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, FileInput, ShieldCheck } from "lucide-react";

const steps = [
  { title: "Upload / Paste Content", description: "Submit a link, text, image, or QR code.", icon: FileInput },
  { title: "AI Analyzes Content", description: "TruthChain-X checks patterns, claims, and risk signals.", icon: Brain },
  { title: "Get Trust Score", description: "Receive a clear score, verdict, and simple explanation.", icon: ShieldCheck }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">How It Works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Simple, secure, and explainable</h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr,auto,1fr,auto,1fr] lg:items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="contents">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
                </motion.div>

                {index < steps.length - 1 ? (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.3, delay: index * 0.08 + 0.1 }}
                    className="hidden items-center justify-center lg:flex"
                  >
                    <ArrowRight className="h-5 w-5 text-slate-500" />
                  </motion.div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
