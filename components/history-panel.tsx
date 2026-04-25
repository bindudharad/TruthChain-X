"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { VerificationRecord } from "@/lib/types";
import { ClientDateText } from "@/components/ui/ClientDateText";

export function HistoryPanel({
  records,
  onSelect
}: {
  records: VerificationRecord[];
  onSelect?: (record: VerificationRecord) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(records[0]?.id || null);

  function handleToggle(record: VerificationRecord, isOpen: boolean) {
    setOpenId(isOpen ? null : record.id);
    onSelect?.(record);
  }

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Verification history</p>
          <p className="text-sm text-slate-400">Re-open previous assessments and compare prior truth scores.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{records.length} entries</span>
      </div>
      <div className="space-y-3">
        {records.length ? (
          records.map((record) => {
            const isOpen = openId === record.id;
            return (
              <motion.div key={record.id} whileHover={{ y: -2 }} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <button className="min-w-0 flex-1 text-left" onClick={() => handleToggle(record, isOpen)}>
                    <p className="truncate text-sm font-medium text-slate-100">{record.fileName}</p>
                    <ClientDateText value={record.timestamp} fallbackLabel={record.timestamp.replace("T", " ").slice(0, 16)} className="mt-1 text-xs text-slate-500" />
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{record.truthScore}%</span>
                    <button
                      onClick={() => handleToggle(record, isOpen)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                    >
                      View Details
                    </button>
                    <motion.button
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      onClick={() => handleToggle(record, isOpen)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2"
                      aria-label={isOpen ? "Collapse history item" : "Expand history item"}
                    >
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </motion.button>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/8">
                      <div className="grid gap-4 p-4 md:grid-cols-[1.4fr,1fr]">
                        <div>
                          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">Summary</p>
                          <p className="text-sm leading-7 text-slate-300">{record.explanation}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Chain proof</p>
                          <p className="mt-3 break-all font-mono text-xs text-slate-300">{record.transactionHash}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
            No verification history yet. Previous trust reports will appear here after the first few submissions.
          </div>
        )}
      </div>
    </div>
  );
}
