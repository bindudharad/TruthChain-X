"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0B0F1A] px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <p className="text-xs uppercase tracking-[0.24em] text-rose-200/80">Runtime Error</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The page hit an unexpected error while rendering. We kept the app shell alive so you can retry without losing the session.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
          {error?.message || "Unknown error"}
        </pre>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(56,189,248,0.24)] transition hover:scale-[1.02]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
