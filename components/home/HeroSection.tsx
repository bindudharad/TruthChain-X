"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative border-b border-white/10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),linear-gradient(180deg,#0b1120_0%,#020617_100%)]" />
      <div className="mx-auto flex min-h-[calc(86vh-4rem)] w-full max-w-7xl items-center px-6 py-20 sm:px-8 lg:px-12">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            TruthChain-X Security Platform
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Know what to trust before you click.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
            AI-powered security system that analyzes links, images, QR codes, and content in real-time.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Designed to protect users from scams, phishing, and misleading content.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/analyze&message=login-required"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Start Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
            >
              Learn How It Works
            </Link>
          </div>

          <div className="mt-6 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            <LockKeyhole className="mt-0.5 h-4 w-4 flex-none text-cyan-200" />
            <span>For your safety and to prevent misuse, login is required before scanning.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
