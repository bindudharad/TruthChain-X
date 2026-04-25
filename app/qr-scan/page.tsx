"use client";

import { ChangeEvent, DragEvent, ReactNode, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, QrCode, ShieldCheck, ShieldX, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHero } from "@/components/layout/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { UnifiedTrustResultPanel } from "@/components/features/trust/UnifiedTrustResultPanel";
import { QRScanResponse } from "@/lib/types";

export default function QRScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QRScanResponse | null>(null);
  const [dragging, setDragging] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  const verdictTone = result?.finalVerdict === "dangerous" ? "danger" : result?.finalVerdict === "suspicious" ? "warning" : "success";
  const isUrlPayload = !!(result?.type === "url" && result.qrContent);
  const canOpen = !!(result?.canOpen && isUrlPayload);
  const canInspectAction = !!(isUrlPayload && result?.finalVerdict !== "dangerous");
  const openHref = result?.type === "url" && result.qrContent ? (result.qrContent.startsWith("http") ? result.qrContent : `https://${result.qrContent}`) : "";
  const categoryBadges = useMemo(() => {
    if (!result) return [];
    return [...result.sensitiveContent.categories, result.phishing.attackType, ...result.claimVerification.tags].filter(Boolean);
  }, [result]);

  function setNextFile(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setError("");
    setWarningOpen(false);

    if (!nextFile) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(nextFile);
    setPreview(objectUrl);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setNextFile(event.target.files?.[0] || null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    setNextFile(event.dataTransfer.files?.[0] || null);
  }

  async function handleScan() {
    if (!file) {
      setError("Upload a QR code image before scanning.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const imageData = await readFileAsDataUrl(file);

      const response = await fetch("/api/qr-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageData,
          mimeType: file.type
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "QR scan failed.");
      }

      setResult(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "QR scan failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenContent() {
    if (!result || !isUrlPayload) return;
    if (result.finalVerdict === "suspicious") {
      setWarningOpen(true);
      return;
    }
    if (!canOpen || !openHref) return;
    window.open(openHref, "_blank", "noopener,noreferrer");
  }

  return (
    <AppShell title="QR Intelligence Scanner" subtitle="Decode QR payloads, classify trust risk, and only open content when it is safe">
      <div className="space-y-6">
        <PageHero
          eyebrow="QR Intelligence"
          title="Scan a QR code, decode the payload, and gate risky links before they open"
          description="This workflow is purpose-built for demo clarity: upload a QR image, inspect the decoded payload, see the safety verdict, and allow opening only when the content earns trust."
          badges={[
            { label: "Instant QR Decode", tone: "info" },
            { label: "Safe Open Controls", tone: "success" },
            { label: "Trust Pipeline Reused", tone: "info" }
          ]}
          stats={[
            { label: "Guardrail", value: canOpen ? "Open Allowed" : "Protected", detail: "Unsafe QR content stays blocked" },
            { label: "Current Verdict", value: result?.finalVerdict?.toUpperCase() || "PENDING", detail: "Safe, suspicious, or dangerous" }
          ]}
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <Card hover={false}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Upload QR image</p>
                <p className="mt-2 text-sm text-slate-400">PNG and JPEG work best. The scanner decodes the QR payload and routes it through the existing phishing and safety pipeline.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <QrCode className="h-5 w-5" />
              </div>
            </div>

            <label
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] ${
                dragging ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_36px_rgba(34,211,238,0.16)]" : "border-white/15 bg-white/[0.03]"
              }`}
            >
              <UploadCloud className="h-10 w-10 text-cyan-100" />
              <span className="mt-4 text-base font-medium text-white">{file ? file.name : "Choose a QR code image"}</span>
              <span className="mt-2 text-sm text-slate-400">Drop in a screenshot or exported QR code to inspect the hidden destination.</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="hidden" />
            </label>

            {preview ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="QR preview" className="max-h-[340px] w-full object-contain bg-slate-950/50" />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-10 text-center text-sm text-slate-400">
                QR preview will appear here after upload.
              </div>
            )}

            {error ? <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleScan} disabled={loading || !file}>
                {loading ? "Scanning..." : "Decode & Analyze"}
              </Button>
              <Button variant="secondary" onClick={handleOpenContent} disabled={!canInspectAction}>
                <ExternalLink className="h-4 w-4" />
                {result?.finalVerdict === "suspicious" ? "Review Warning" : "Open Content"}
              </Button>
            </div>
          </Card>

          <Card hover={false}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Decoded result</p>
                <p className="mt-2 text-sm text-slate-400">The scanner shows the QR payload, risk category, and why the system chose to block or allow it.</p>
              </div>
              <Badge tone={result ? verdictTone : "info"}>{result ? result.finalVerdict.toUpperCase() : "WAITING"}</Badge>
            </div>

            {result ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Verdict">
                    <Badge tone={verdictTone} className="text-sm uppercase">{result.finalVerdict}</Badge>
                  </MetricCard>
                  <MetricCard label="QR Type" value={result.type.toUpperCase()} />
                  <MetricCard label="Risk Score">
                    <p className="mt-2 text-2xl font-semibold text-white">
                      <CountUp value={result.unified.score} suffix="%" />
                    </p>
                  </MetricCard>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">QR Content</p>
                  <p className="mt-3 break-all text-sm leading-7 text-slate-200">{result.qrContent || "No QR payload decoded."}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoryBadges.length ? (
                    categoryBadges.map((category) => (
                      <Badge key={category} tone={category === "url-spoofing" ? "danger" : "warning"}>
                        {category.replace(/-/g, " ")}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="success">No risky categories</Badge>
                  )}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <DetailBlock title="Explanation" icon={<AlertTriangle className="h-4 w-4 text-amber-200" />}>
                    {result.explanation.map((item) => (
                      <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </DetailBlock>

                  <DetailBlock title="Safety controls" icon={canOpen ? <ShieldCheck className="h-4 w-4 text-emerald-200" /> : <ShieldX className="h-4 w-4 text-rose-200" />}>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-200">
                      {canOpen
                        ? "This QR payload is classified as safe, so opening the content is allowed."
                        : result.finalVerdict === "dangerous"
                          ? "Dangerous QR content is blocked from opening."
                          : "Suspicious QR content stays gated until a reviewer decides to trust it."}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-3 py-3 text-sm text-slate-300">
                      AI text probability: {result.aiDetection.text?.aiGeneratedProbability ?? 0}% | Sensitive severity: {result.sensitiveContent.severity.toUpperCase()}
                    </div>
                  </DetailBlock>
                </div>
                <UnifiedTrustResultPanel result={result.unified} />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-12 text-center text-sm text-slate-400">
                Upload a QR image to see the decoded payload, risk verdict, categories, and opening controls.
              </div>
            )}
          </Card>
        </section>
      </div>
      {warningOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <Card hover={false} className="w-full max-w-lg border-amber-400/25 bg-[#0b0f1a]/95">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Suspicious QR content blocked</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  This QR payload is not classified as dangerous, but it still contains enough risk signals that TruthChain-X will not open it automatically.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Decoded destination</p>
              <p className="mt-2 break-all text-sm text-slate-200">{result?.qrContent}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => setWarningOpen(false)}>Stay Protected</Button>
              <Button variant="secondary" onClick={() => setWarningOpen(false)}>Close Warning</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the QR image."));
    reader.readAsDataURL(file);
  });
}

function MetricCard({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {children || <p className="mt-2 text-2xl font-semibold text-white">{value}</p>}
    </div>
  );
}

function DetailBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
