"use client";

import { ReactNode } from "react";
import { useMounted } from "@/hooks/useMounted";

export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useMounted();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
