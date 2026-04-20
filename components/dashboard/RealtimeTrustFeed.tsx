"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type FeedItem = {
  id: string;
  label: string;
  score: number;
  timestamp: string;
  status: string;
  channel: string;
};

export function RealtimeTrustFeed({ items }: { items: FeedItem[] }) {
  const [visibleItems, setVisibleItems] = useState(items.slice(0, 4));

  useEffect(() => {
    setVisibleItems(items.slice(0, 4));
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setVisibleItems((current) => {
        const firstId = current[0]?.id;
        const startIndex = Math.max(0, items.findIndex((item) => item.id === firstId) - 1);
        return items.slice(startIndex, startIndex + 4);
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [items]);

  const statusStyles = useMemo(
    () => ({
      "high-risk": "text-rose-200 border-rose-400/20 bg-rose-400/10",
      watch: "text-amber-200 border-amber-400/20 bg-amber-400/10",
      trusted: "text-emerald-200 border-emerald-400/20 bg-emerald-400/10"
    }),
    []
  );

  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className="panel panel-hover rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Real-Time Trust Feed</p>
          <p className="text-sm text-slate-400">Continuous stream of newly analyzed content flowing through the platform.</p>
        </div>
        <motion.div animate={{ opacity: [0.45, 1, 0.45] }} transition={{ repeat: Infinity, duration: 1.5 }} className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>

      <div className="space-y-3 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.channel} | {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{item.score}%</p>
                    <p className={`mt-1 rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusStyles[item.status as keyof typeof statusStyles] || "border-white/10 bg-white/5 text-slate-300"}`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="feed-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400"
            >
              The live trust feed is waiting for new verification events.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
