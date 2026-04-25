import { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 shadow-[0_0_18px_rgba(34,197,94,0.08)]",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.08)]",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.08)]",
    info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-[0_0_18px_rgba(56,189,248,0.08)]"
  };

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em]", tones[tone], className)}>{children}</span>;
}
