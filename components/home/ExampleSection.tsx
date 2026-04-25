"use client";

import { FileText, Image, Link2, PlayCircle, QrCode, ShieldCheck, TriangleAlert } from "lucide-react";

const urlExamples = [
  {
    label: "Safe URL",
    value: "https://google.com",
    score: "94 / 100",
    tone: "safe",
    reason: "Known domain with no suspicious login pattern."
  },
  {
    label: "Fake URL",
    value: "amazon-secure-login.xyz",
    score: "18 / 100",
    tone: "risk",
    reason: "Looks like a brand spoof and asks for account access."
  }
];

const examples = [
  {
    title: "Image check",
    icon: Image,
    safe: "Original product photo",
    risk: "Edited giveaway image",
    reason: "Flags reused or manipulated visuals."
  },
  {
    title: "QR code check",
    icon: QrCode,
    safe: "Official payment QR",
    risk: "Hidden phishing link",
    reason: "Decodes the QR before the user opens it."
  },
  {
    title: "Video / content check",
    icon: PlayCircle,
    safe: "Verified news clip",
    risk: "Unverified viral claim",
    reason: "Checks claim signals and trusted source coverage."
  }
];

function toneClasses(tone: "safe" | "risk") {
  return tone === "safe"
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-rose-400/20 bg-rose-400/10 text-rose-100";
}

export function ExampleSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Detection Examples</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">See how detection works</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            The output stays simple: a score, a verdict, and the main reason.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {urlExamples.map((item) => (
            <div key={item.label} className={`rounded-2xl border p-6 ${toneClasses(item.tone as "safe" | "risk")}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.tone === "safe" ? <ShieldCheck className="h-5 w-5" /> : <TriangleAlert className="h-5 w-5" />}
                  <p className="font-semibold">{item.label}</p>
                </div>
                <p className="text-sm font-semibold">{item.score}</p>
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Link2 className="h-4 w-4" />
                  <span className="break-all">{item.value}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {examples.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/8 p-3 text-emerald-100">{item.safe}</div>
                  <div className="rounded-xl border border-rose-400/15 bg-rose-400/8 p-3 text-rose-100">{item.risk}</div>
                </div>
                <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-400">
                  <FileText className="mt-0.5 h-4 w-4 flex-none text-cyan-200" />
                  {item.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
