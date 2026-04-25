"use client";

import { ClientDateText } from "@/components/ui/ClientDateText";

type FeedItem = {
  id: string;
  label: string;
  score: number;
  timestamp: string;
  status: string;
  channel: string;
};

function statusTone(status: string) {
  if (status === "high-risk") return "bg-rose-400/10 text-rose-200 border-rose-400/20";
  if (status === "watch") return "bg-amber-400/10 text-amber-200 border-amber-400/20";
  return "bg-emerald-400/10 text-emerald-200 border-emerald-400/20";
}

export function RealtimeTrustFeed({ items }: { items: FeedItem[] }) {
  const visibleItems = items.slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">Real-Time Feed</p>
          <p className="text-sm text-slate-400">A simple stream of the latest verification activity.</p>
        </div>
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>

      <div className="space-y-3">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4 transition-all duration-200 hover:translate-y-[-2px] hover:border-cyan-300/20 hover:shadow-[0_16px_32px_rgba(15,23,42,0.2)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    {item.channel}
                  </span>{" "}
                  <span className="text-slate-300">{item.label}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <ClientDateText value={item.timestamp} mode="time" fallbackLabel={item.timestamp.slice(11, 16)} />
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{item.score}%</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${statusTone(item.status)}`}>{item.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-400">
            The live feed will appear here after new scans are processed.
          </div>
        )}
      </div>
    </div>
  );
}
