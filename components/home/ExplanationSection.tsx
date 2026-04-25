"use client";

export function ExplanationSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">How TruthChain-X Works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Clear decisions, not confusing alerts</h2>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300">
            TruthChain-X uses AI to analyze patterns, detect suspicious signals, and verify content using trusted sources.
            It then gives a clear trust score and explanation so users can make safe decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
