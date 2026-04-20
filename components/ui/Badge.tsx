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
    neutral: "border-white/10 bg-white/5 text-slate-200",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
  };

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs", tones[tone], className)}>{children}</span>;
}
