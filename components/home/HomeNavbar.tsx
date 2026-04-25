"use client";

import Link from "next/link";
import { Github, LayoutDashboard, LogIn, ScanSearch, ShieldCheck } from "lucide-react";

export function HomeNavbar() {
  return (
    <header className="sticky top-0 z-[90] border-b border-white/10 bg-[#0B0F1A]/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
          </span>
          TruthChain-X
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login?next=/analyze&message=login-required"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
          >
            <ScanSearch className="h-4 w-4" />
            Analysis
          </Link>
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 sm:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 md:inline-flex"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <Link
            href="/login?next=/analyze&message=login-required"
            className="hidden items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 md:inline-flex"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
