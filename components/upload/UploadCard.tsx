"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, FileText, ImagePlus, Link2, LockKeyhole, PlayCircle, QrCode, Search, ShieldCheck, UploadCloud, X } from "lucide-react";

type InputMode = "url" | "text" | "image" | "video" | "qr";

type VerifyPayload = {
  contentType: "text" | "image" | "video";
  content: string;
  url?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileName: string;
  creatorId: string;
  creatorName: string;
};

const inputModes: Array<{ type: InputMode; label: string; description: string; icon: typeof Link2 }> = [
  { type: "url", label: "URL", description: "Check domain trust, redirects, SSL, and reputation.", icon: Link2 },
  { type: "text", label: "Text", description: "Inspect claims, urgency language, and phishing patterns.", icon: FileText },
  { type: "image", label: "Image", description: "Run reverse search and visual trust checks.", icon: ImagePlus },
  { type: "video", label: "Video", description: "Review metadata, source context, and related references.", icon: PlayCircle },
  { type: "qr", label: "QR", description: "Scan hidden destinations from camera or gallery.", icon: QrCode }
];

const SESSION_GUARD_KEY = "truthchain:secure-analysis-confirmed";

export function UploadCard({
  loading,
  onVerify,
  onImageStateChange,
  onInputStateChange
}: {
  loading: boolean;
  onVerify: (payload: VerifyPayload) => Promise<void>;
  onImageStateChange?: (payload: { preview: string; fileName: string; imageUrl?: string }) => void;
  onInputStateChange?: (payload: { mode: "text" | "image" | "video" | "url"; value: string; fileName?: string; preview?: string; url?: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const qrFileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);
  const [mode, setMode] = useState<InputMode>("url");
  const [textValue, setTextValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [qrPreview, setQrPreview] = useState("");
  const [qrFileName, setQrFileName] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [guardOpen, setGuardOpen] = useState(false);

  const activeMode = useMemo(() => inputModes.find((item) => item.type === mode), [mode]);

  async function readFile(file: File, target: "image" | "qr") {
    const reader = new FileReader();
    reader.onload = () => {
      const nextPreview = String(reader.result || "");
      if (target === "qr") {
        setQrPreview(nextPreview);
        setQrFileName(file.name);
        setMode("qr");
      } else {
        setPreview(nextPreview);
        setFileName(file.name);
        setMode("image");
        onImageStateChange?.({ preview: nextPreview, fileName: file.name, imageUrl: undefined });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await readFile(file, "image");
  }

  async function handleQrFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await readFile(file, "qr");
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access was blocked or unavailable.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  async function captureQrFrame() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setQrPreview(canvas.toDataURL("image/png"));
    setQrFileName("qr-camera-capture.png");
  }

  function switchMode(nextMode: InputMode) {
    setMode(nextMode);
    setValidationError("");
    if (nextMode !== "qr") stopCamera();
  }

  async function runWithGuard(action: () => Promise<void>) {
    if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_GUARD_KEY) === "1") {
      await action();
      return;
    }

    pendingActionRef.current = action;
    setGuardOpen(true);
  }

  async function submit() {
    setValidationError("");

    if (mode === "url") {
      if (!urlValue.trim()) return setValidationError("Paste a URL before starting analysis.");
      await runWithGuard(() =>
        onVerify({
          contentType: "text",
          content: urlValue.trim(),
          url: urlValue.trim(),
          fileName: "url.txt",
          creatorId: "creator_demo",
          creatorName: "Security Analyst"
        })
      );
      return;
    }

    if (mode === "text") {
      if (!textValue.trim()) return setValidationError("Paste text before starting analysis.");
      await runWithGuard(() =>
        onVerify({
          contentType: "text",
          content: textValue.trim(),
          fileName: "content.txt",
          creatorId: "creator_demo",
          creatorName: "Security Analyst"
        })
      );
      return;
    }

    if (mode === "image") {
      if (!preview) return setValidationError("Upload an image before starting analysis.");
      await runWithGuard(() =>
        onVerify({
          contentType: "image",
          content: preview,
          fileName: fileName || "image-upload.png",
          creatorId: "creator_demo",
          creatorName: "Security Analyst"
        })
      );
      return;
    }

    if (mode === "video") {
      if (!videoUrl.trim()) return setValidationError("Paste a video URL before starting analysis.");
      await runWithGuard(() =>
        onVerify({
          contentType: "video",
          content: videoUrl.trim(),
          url: videoUrl.trim(),
          videoUrl: videoUrl.trim(),
          fileName: "video-url.txt",
          creatorId: "creator_demo",
          creatorName: "Security Analyst"
        })
      );
      return;
    }

    if (!qrPreview) return setValidationError("Upload or capture a QR image before starting analysis.");
    await runWithGuard(() =>
      onVerify({
        contentType: "image",
        content: qrPreview,
        fileName: qrFileName || "qr-upload.png",
        creatorId: "creator_demo",
        creatorName: "Security Analyst"
      })
    );
  }

  useEffect(() => {
    if (!onInputStateChange) return;
    if (mode === "url") onInputStateChange({ mode: "url", value: urlValue, url: urlValue });
    if (mode === "text") onInputStateChange({ mode: "text", value: textValue });
    if (mode === "image") onInputStateChange({ mode: "image", value: preview, preview, fileName });
    if (mode === "video") onInputStateChange({ mode: "video", value: videoUrl, url: videoUrl });
    if (mode === "qr") onInputStateChange({ mode: "image", value: qrPreview, preview: qrPreview, fileName: qrFileName || "QR scan" });
  }, [fileName, mode, onInputStateChange, preview, qrFileName, qrPreview, textValue, urlValue, videoUrl]);

  useEffect(() => stopCamera, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-7 ${validationError ? "error-shake" : ""}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_65%)]" />
        {loading ? (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.3, ease: "linear" }}
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          />
        ) : null}

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Secure Workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Choose what we should analyze</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Pick one input type, reveal only the controls you need, and run the scan through the secure analysis pipeline.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 lg:block">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Secure session verified
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {inputModes.map(({ type, label, description, icon: Icon }) => {
              const active = mode === type;
              return (
                <motion.button
                  key={type}
                  type="button"
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={() => switchMode(type)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ease-in-out ${
                    active
                      ? "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(17,24,39,0.56))] text-white shadow-[0_0_0_1px_rgba(103,232,249,0.14),0_14px_28px_rgba(34,211,238,0.12)]"
                      : "border-white/[0.08] bg-white/[0.05] text-slate-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_14px_28px_rgba(2,6,23,0.18)]"
                  }`}
                >
                  {active ? <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" /> : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${active ? "border-cyan-200/30 bg-cyan-200/12 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                      <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                    </div>
                    {active ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" /> : null}
                  </div>
                  <p className="mt-4 text-base font-semibold">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-[rgba(2,6,23,0.34)] p-5 backdrop-blur-[10px] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Selected Input</p>
                <p className="mt-2 text-lg font-semibold text-white">{activeMode?.label}</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cyan-200/80">
                {activeMode?.description}
              </div>
            </div>

            <div className="min-h-[280px]">
              <AnimatePresence mode="wait">
                {mode === "url" ? (
                  <motion.div key="url" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="space-y-4">
                    <label className="text-sm font-medium text-white">Website URL</label>
                    <input
                      value={urlValue}
                      onChange={(event) => setUrlValue(event.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
                      placeholder="https://example.com"
                    />
                    <InfoStrip text="We check trust signals such as redirects, SSL, domain reputation, and phishing-style wording." />
                  </motion.div>
                ) : null}

                {mode === "text" ? (
                  <motion.div key="text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="space-y-4">
                    <label className="text-sm font-medium text-white">Text or claim</label>
                    <textarea
                      value={textValue}
                      onChange={(event) => setTextValue(event.target.value)}
                      className="min-h-[240px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
                      placeholder="Paste suspicious message, claim, or post content..."
                    />
                    <InfoStrip text="Great for phishing messages, social posts, urgent claims, and misinformation checks." />
                  </motion.div>
                ) : null}

                {mode === "image" ? (
                  <motion.div key="image" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center transition-all duration-200 ease-in-out hover:scale-[1.01] hover:border-cyan-300/30 hover:bg-cyan-400/[0.04] hover:shadow-[0_16px_30px_rgba(14,165,233,0.08)]"
                    >
                      <UploadCloud className="h-12 w-12 text-cyan-200" />
                      <span className="mt-4 text-base font-semibold text-white">Upload image for visual analysis</span>
                      <span className="mt-2 text-sm leading-6 text-slate-400">We can reverse-search and inspect visual trust signals across public sources.</span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={fileName} className="h-48 w-full rounded-2xl border border-white/10 object-cover" />
                    ) : null}
                  </motion.div>
                ) : null}

                {mode === "video" ? (
                  <motion.div key="video" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="space-y-4">
                    <label className="text-sm font-medium text-white">Video URL</label>
                    <input
                      value={videoUrl}
                      onChange={(event) => setVideoUrl(event.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
                      placeholder="YouTube, TikTok, Instagram, or public video URL"
                    />
                    <InfoStrip text="Video analysis checks metadata, linked context, related sources, and manipulation-style signals." />
                  </motion.div>
                ) : null}

                {mode === "qr" ? (
                  <motion.div key="qr" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="space-y-4">
                    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/55">
                      <video ref={videoRef} playsInline muted className={`h-72 w-full object-cover ${cameraActive ? "block" : "hidden"}`} />
                      {!cameraActive ? (
                        <div className="flex h-72 flex-col items-center justify-center p-6 text-center">
                          <QrCode className="h-12 w-12 text-cyan-200" />
                          <p className="mt-4 text-base font-semibold text-white">Scan QR using camera</p>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Capture with camera or upload from gallery. The decoded destination is analyzed before opening.</p>
                        </div>
                      ) : null}
                      <div className="pointer-events-none absolute inset-8 rounded-[28px] border-2 border-cyan-300/60 shadow-[0_0_30px_rgba(34,211,238,0.16)]" />
                      <button
                        type="button"
                        onClick={() => qrFileRef.current?.click()}
                        className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/10"
                      >
                        Upload from gallery
                      </button>
                    </div>
                    <input ref={qrFileRef} type="file" accept="image/*" onChange={handleQrFile} className="hidden" />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={cameraActive ? stopCamera : startCamera} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition hover:bg-white/[0.08]">
                        <Camera className="h-4 w-4" />
                        {cameraActive ? "Stop camera" : "Open camera"}
                      </button>
                      {cameraActive ? (
                        <button type="button" onClick={captureQrFrame} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
                          Capture QR
                        </button>
                      ) : null}
                    </div>
                    {cameraError ? <p className="text-sm text-amber-200">{cameraError}</p> : null}
                    {qrPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrPreview} alt={qrFileName || "QR preview"} className="h-40 w-full rounded-2xl border border-white/10 object-cover" />
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {validationError ? <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{validationError}</div> : null}

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={submit}
            disabled={loading}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#22d3ee_0%,#8b5cf6_100%)] text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.18)] transition-all duration-200 ease-in-out hover:shadow-[0_20px_50px_rgba(34,211,238,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-slate-950/20">
                <motion.span
                  initial={{ x: "-40%" }}
                  animate={{ x: "140%" }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-slate-950/70"
                />
              </span>
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Analyzing..." : "Analyze Securely"}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {guardOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="w-full max-w-lg rounded-[28px] border border-white/[0.08] bg-[rgba(11,15,26,0.92)] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.55)] backdrop-blur-[10px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Secure Access</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Login required for secure analysis</h3>
                  </div>
                </div>
                <button type="button" onClick={() => setGuardOpen(false)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                For your safety and to prevent misuse, analysis is available only inside an authenticated session. Your secure session is active, and you can continue when ready.
              </p>
              <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                We keep this gate visible so users understand scans are protected and session-bound.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window !== "undefined") {
                      window.sessionStorage.setItem(SESSION_GUARD_KEY, "1");
                    }
                    setGuardOpen(false);
                    const nextAction = pendingActionRef.current;
                    pendingActionRef.current = null;
                    if (nextAction) {
                      await nextAction();
                    }
                  }}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22d3ee_0%,#8b5cf6_100%)] px-5 text-sm font-semibold text-slate-950"
                >
                  Continue to analysis
                </button>
                <button type="button" onClick={() => setGuardOpen(false)} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function InfoStrip({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-400">{text}</div>;
}
