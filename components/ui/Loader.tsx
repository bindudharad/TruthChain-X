import { cn } from "@/utils/cn";

export function Loader({ className }: { className?: string }) {
  return <span className={cn("gradient-spinner", className)} aria-label="Loading" />;
}
