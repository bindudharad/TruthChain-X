"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function BlockchainStatusBadge({
  status,
  txHash
}: {
  status: "confirmed" | "queued";
  txHash: string;
}) {
  const safeHash = txHash?.trim() || "Transaction pending";

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{
          opacity: 1,
          y: 0,
          boxShadow:
            status === "confirmed"
              ? ["0 0 0 rgba(16,185,129,0)", "0 0 18px rgba(16,185,129,0.18)", "0 0 0 rgba(16,185,129,0)"]
              : ["0 0 0 rgba(250,204,21,0)", "0 0 16px rgba(250,204,21,0.14)", "0 0 0 rgba(250,204,21,0)"]
        }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        <Badge tone={status === "confirmed" ? "success" : "warning"} className="inline-flex items-center gap-2 text-xs">
          {status === "confirmed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          Stored on Blockchain {status === "confirmed" ? "OK" : "Queued"}
        </Badge>
      </motion.div>
      <p className="break-all font-mono text-xs text-slate-300">{safeHash}</p>
    </div>
  );
}
