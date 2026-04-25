"use client";

import { useMemo } from "react";
import { useMounted } from "@/hooks/useMounted";

type Props = {
  value?: string | null;
  mode?: "date" | "datetime" | "time";
  emptyLabel?: string;
  fallbackLabel?: string;
  className?: string;
};

export function ClientDateText({ value, mode = "datetime", emptyLabel = "-", fallbackLabel, className }: Props) {
  const mounted = useMounted();

  const formatted = useMemo(() => {
    if (!value) return emptyLabel;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return emptyLabel;

    if (mode === "date") {
      return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    if (mode === "time") {
      return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return parsed.toLocaleString();
  }, [emptyLabel, mode, value]);

  if (!mounted) {
    return <span className={className}>{fallbackLabel ?? emptyLabel}</span>;
  }

  return <span className={className}>{formatted}</span>;
}
