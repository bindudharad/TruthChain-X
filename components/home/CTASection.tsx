import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(139,92,246,0.12))] px-6 py-12 shadow-lg backdrop-blur-2xl sm:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Ready to start</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Stop guessing. Start verifying before users lose money.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Move from suspicion to a clear trust decision in one fast, explainable flow.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(255,255,255,0.12)]"
            >
              Scan Now (Free)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:scale-[1.03] hover:bg-white/[0.08]"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
