"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function NotificationCenterBase({
  items
}: {
  items: Array<{ id: string; title: string; detail: string; level: "info" | "warning" | "danger" }>;
}) {
  const tone = {
    info: "info",
    warning: "warning",
    danger: "danger"
  } as const;

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Alert System</p>
          <p className="text-sm text-slate-400">User-facing notifications for risky detections, mutations, and trust events.</p>
        </div>
        <Badge tone="info">{items.length} alerts</Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <Badge tone={tone[item.level]}>{item.level}</Badge>
            </div>
            <p className="text-sm text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export const NotificationCenter = memo(NotificationCenterBase);
