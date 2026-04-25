"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClientDateText } from "@/components/ui/ClientDateText";
import { api } from "@/services/api";

function TrustPassportPanelBase({
  hash,
  fingerprintId,
  score,
  txHash
}: {
  hash: string;
  fingerprintId: string;
  score: number;
  txHash: string;
}) {
  const [qr, setQr] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [summary, setSummary] = useState("");
  const [origin, setOrigin] = useState("");
  const shareUrl = useMemo(() => `${origin || "https://truthchainx.app"}/passport/${hash}`, [hash, origin]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { margin: 1, width: 180 }).then(setQr).catch(() => setQr(""));
  }, [shareUrl]);

  useEffect(() => {
    api
      .get<{ summary: { timestamp: string; explanation: string } }>(`/api/passport/${hash}`)
      .then((data) => {
        setTimestamp(data.summary?.timestamp || "");
        setSummary(data.summary?.explanation || "");
      })
      .catch(() => undefined);
  }, [hash]);

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">Trust Passport</p>
          <p className="text-sm text-slate-400">Shareable trust record with blockchain proof and fingerprint identity.</p>
        </div>
        <Badge tone="info">Passport Ready</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-[0.8fr,1.2fr]">
        <div className="grid place-items-center rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Trust passport QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
          ) : (
            <div className="h-40 w-40 rounded-lg bg-white/5" />
          )}
        </div>
        <div className="space-y-3">
          <PassportRow label="Fingerprint ID" value={fingerprintId} />
          <PassportRow label="Truth Score" value={`${score}%`} />
          <PassportRow
            label="First Verified"
            value={
              timestamp ? <ClientDateText value={timestamp} fallbackLabel={timestamp.replace("T", " ").slice(0, 16)} /> : "Loading..."
            }
          />
          <PassportRow label="Content Hash" value={hash} mono />
          <PassportRow label="Transaction" value={txHash} mono />
          <PassportRow label="Content Summary" value={summary || "Loading summary..."} />
          <div className="pt-2">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(shareUrl).catch(() => undefined);
                  }
                }}
              >
                Copy Share Link
              </Button>
              <Link href={`/passport/${hash}`}>
                <Button variant="secondary">Open Passport</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PassportRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm text-slate-200 ${mono ? "break-all font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export const TrustPassportPanel = memo(TrustPassportPanelBase);
