"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, History, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ClientDateText } from "@/components/ui/ClientDateText";
import { VerificationRecord } from "@/lib/types";

type VerifyResult = {
  foundOnChain: boolean;
  matches: boolean;
};

function toneForScore(score: number) {
  if (score < 40) return "danger" as const;
  if (score < 70) return "warning" as const;
  return "success" as const;
}

export function HistoryTimeline({ records }: { records: VerificationRecord[] }) {
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);
  const [verificationMap, setVerificationMap] = useState<Record<string, VerifyResult>>({});

  async function verify(hash: string) {
    try {
      setVerifyingHash(hash);
      const response = await fetch(`/api/verify-authenticity?hash=${encodeURIComponent(hash)}`, { cache: "no-store" });
      const data = (await response.json()) as VerifyResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }
      setVerificationMap((current) => ({
        ...current,
        [hash]: {
          foundOnChain: data.foundOnChain,
          matches: data.matches
        }
      }));
    } catch {
      setVerificationMap((current) => ({
        ...current,
        [hash]: {
          foundOnChain: false,
          matches: false
        }
      }));
    } finally {
      setVerifyingHash(null);
    }
  }

  return (
    <Card hover={false} className="rounded-2xl bg-white/[0.05] p-6 backdrop-blur-xl shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <History className="h-5 w-5 text-cyan-100" />
        <div>
          <p className="text-lg font-semibold text-white">Scan History</p>
          <p className="text-sm text-slate-400">Every verification record, with chain access and authenticity checks.</p>
        </div>
      </div>

      <div className="space-y-4">
        {records.length ? (
          records.slice(0, 8).map((record) => {
            const verification = verificationMap[record.hash];
            return (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={toneForScore(record.truthScore)}>{record.unified?.category || (record.truthScore < 40 ? "Risk" : record.truthScore < 70 ? "Suspicious" : "Safe")}</Badge>
                      <Badge tone={record.blockchainStatus === "confirmed" ? "success" : "info"}>{record.blockchainStatus}</Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-medium text-white">{record.fileName}</p>
                    <div className="mt-3 max-h-24 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">
                      {record.sourcePreview}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>Score: {record.truthScore}%</span>
                      <span>
                        <ClientDateText value={record.timestamp} mode="datetime" fallbackLabel={record.timestamp} />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[270px] lg:justify-end">
                    {record.transactionHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Blockchain
                      </a>
                    ) : null}
                    <Button variant="secondary" onClick={() => verify(record.hash)} disabled={verifyingHash === record.hash}>
                      <ShieldCheck className="h-4 w-4" />
                      {verifyingHash === record.hash ? "Verifying..." : "Verify Authenticity"}
                    </Button>
                  </div>
                </div>

                {verification ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                    <CheckCircle2 className={`h-4 w-4 ${verification.matches ? "text-emerald-300" : "text-amber-300"}`} />
                    {verification.matches
                      ? "Database record matches the blockchain fingerprint."
                      : verification.foundOnChain
                        ? "Blockchain record exists, but fields differ from the local record."
                        : "No blockchain fingerprint was found for this hash."}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-400">
            Scan history will appear here after the first verification completes.
          </div>
        )}
      </div>
    </Card>
  );
}
