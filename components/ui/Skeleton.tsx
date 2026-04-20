import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer-soft rounded-xl border border-white/[0.04] bg-white/[0.045]", className)} />;
}
