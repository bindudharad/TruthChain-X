"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Fingerprint, ShieldCheck, ShieldAlert, ScanSearch, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { TrustFingerprint } from "@/lib/types";

const levelStyles = {
  low: "text-rose-200 border-rose-400/20 bg-rose-400/10",
  medium: "text-amber-200 border-amber-400/20 bg-amber-400/10",
  high: "text-emerald-200 border-emerald-400/20 bg-emerald-400/10"
};

export function TrustFingerprintCard({
  fingerprint,
  hash,
  blockchainStatus
}: {
  fingerprint: TrustFingerprint;
  hash: string;
  blockchainStatus: "confirmed" | "queued";
}) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(JSON.stringify({ hash, fingerprintId: fingerprint.fingerprintId, truthScore: fingerprint.truthScore }))
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [fingerprint.fingerprintId, fingerprint.truthScore, hash]);

  const items = [
    { label: "Manipulation Risk", value: fingerprint.manipulationRisk, icon: ShieldAlert },
    { label: "Source Credibility", value: fingerprint.sourceCredibility, icon: ShieldCheck },
    { label: "AI Consensus", value: `${fingerprint.aiConsensus}%`, icon: BadgeCheck },
    { label: "Similar Matches", value: `${fingerprint.similarMatches}`, icon: ScanSearch }
  ];

  return (
    <div className="panel rounded-lg p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Trust fingerprint</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Digital trust identity</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">A permanent fingerprint of credibility, manipulation risk, source trust, and consensus.</p>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-100">
          <Fingerprint className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <item.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-3">
                {typeof item.value === "string" && (item.value === "low" || item.value === "medium" || item.value === "high") ? (
                  <span className={`rounded-full border px-2.5 py-1 text-sm capitalize ${levelStyles[item.value]}`}>{item.value}</span>
                ) : (
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fingerprint ID</p>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${blockchainStatus === "confirmed" ? levelStyles.high : levelStyles.medium}`}>
              {blockchainStatus === "confirmed" ? "On-chain" : "Queued"}
            </span>
          </div>
          <p className="mt-3 break-all font-mono text-sm text-slate-100">{fingerprint.fingerprintId}</p>
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="Trust fingerprint QR" className="mt-4 h-36 w-36 rounded-lg border border-white/10 bg-white p-2" />
          ) : null}
          <p className="mt-4 text-xs leading-6 text-slate-500">Scan to verify the trust fingerprint and associated content hash.</p>
        </div>
      </div>
    </div>
  );
}
