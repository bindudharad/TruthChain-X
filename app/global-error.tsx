"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0F1A] px-6 py-16 text-slate-100">
        <main className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-200/80">Critical Error</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">The app hit a fatal render error</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            A top-level rendering failure occurred. Use the reset action below to recover the app shell.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
            {error?.message || "Unknown error"}
          </pre>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(56,189,248,0.24)] transition hover:scale-[1.02]"
          >
            Reload app
          </button>
        </main>
      </body>
    </html>
  );
}
