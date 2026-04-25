"use client";

import { useEffect, useMemo, useState } from "react";

export function CountUp({
  value,
  duration = 680,
  suffix = "",
  prefix = ""
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const safeValue = useMemo(() => Math.max(0, Math.round(value)), [value]);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(safeValue * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    setDisplayValue(0);
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, safeValue]);

  return (
    <span suppressHydrationWarning>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
