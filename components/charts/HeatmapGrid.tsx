"use client";

import { memo } from "react";

function HeatmapGridBase({ cells }: { cells: Array<{ label: string; intensity: number }> }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-lg border border-white/10"
          style={{
            height: "52px",
            background: `linear-gradient(180deg, rgba(244,63,94,${Math.max(cell.intensity / 110, 0.2)}), rgba(14,23,38,0.55))`
          }}
          title={`${cell.label}: ${cell.intensity}%`}
        />
      ))}
    </div>
  );
}

export const HeatmapGrid = memo(HeatmapGridBase);
