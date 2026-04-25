"use client";

import { Brain, LockKeyhole, Radar, ShieldCheck } from "lucide-react";

const indicators = [
  { title: "AI-powered analysis", description: "Detects phishing, spam, and suspicious content signals.", icon: Brain },
  { title: "Real-time verification", description: "Checks content against live trust and source signals.", icon: Radar },
  { title: "Privacy focused", description: "Designed to avoid exposing user scans publicly.", icon: LockKeyhole },
  { title: "Secure system", description: "Authentication is required before scanning content.", icon: ShieldCheck }
];

export function SecurityTrustSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Trust Indicators</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built for safer digital decisions</h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
          Your data is not shared publicly.
        </p>
      </div>
    </section>
  );
}
