import { Database } from "lucide-react";

const techStack = ["Next.js", "MongoDB", "Groq / LLM APIs", "Blockchain-ready verification"];

export function TechStackSection() {
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Built to scale quietly</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Modern foundations, low-friction product experience</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {techStack.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-sm text-slate-200 backdrop-blur-xl shadow-lg">
                <Database className="h-4 w-4 text-cyan-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
