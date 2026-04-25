"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Link2, PlayCircle, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { scaleIn } from "@/animations/presets";

type VerifyPayload = {
  contentType: "text" | "image" | "video";
  content: string;
  url?: string;
  videoUrl?: string;
  fileName: string;
  creatorId: string;
  creatorName: string;
};

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [contentType, setContentType] = useState<"text" | "image" | "video" | "url">("text");
  const [textValue, setTextValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [creatorId, setCreatorId] = useState("creator_demo");
  const [creatorName, setCreatorName] = useState("Demo Creator");
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (contentType === "text" || contentType === "url" || contentType === "video") {
      setDragging(false);
      onImageStateChange?.({ preview: "", fileName: "", imageUrl: undefined });
    }
  }, [contentType, onImageStateChange]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const nextPreview = String(reader.result || "");
      setPreview(nextPreview);
      setFileName(file.name);
      setContentType("image");
      onImageStateChange?.({ preview: nextPreview, fileName: file.name, imageUrl: urlValue.trim() || undefined });
    };
    reader.readAsDataURL(file);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    await handleFiles(event.dataTransfer.files);
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    await handleFiles(event.target.files);
  }

  function switchType(nextType: "text" | "image" | "video" | "url") {
    setContentType(nextType);
    setValidationError("");
    if (nextType === "text") {
      setPreview("");
      setFileName("");
      onImageStateChange?.({ preview: "", fileName: "", imageUrl: undefined });
    } else if (nextType === "image") {
      setTextValue("");
      onImageStateChange?.({ preview, fileName, imageUrl: urlValue.trim() || undefined });
    } else {
      setPreview("");
      setFileName("");
      onImageStateChange?.({ preview: "", fileName: "", imageUrl: undefined });
    }
  }

  async function submit() {
    if (contentType === "text") {
      if (!textValue.trim()) {
        setValidationError("Add text before starting verification.");
        return;
      }
      await onVerify({
        contentType: "text",
        content: textValue,
        url: urlValue.trim() || undefined,
        fileName: "claim.txt",
        creatorId,
        creatorName
      });
      return;
    }

    if (contentType === "url") {
      if (!urlValue.trim()) {
        setValidationError("Add a website URL before starting verification.");
        return;
      }

      await onVerify({
        contentType: "text",
        content: urlValue,
        url: urlValue.trim(),
        fileName: "url.txt",
        creatorId,
        creatorName
      });
      return;
    }

    if (contentType === "video") {
      if (!urlValue.trim()) {
        setValidationError("Add a video URL before starting verification.");
        return;
      }

      await onVerify({
        contentType: "video",
        content: textValue.trim() || urlValue,
        url: urlValue.trim(),
        videoUrl: urlValue.trim(),
        fileName: "video-link.txt",
        creatorId,
        creatorName
      });
      return;
    }

    if (!preview) {
      setValidationError("Upload an image before starting verification.");
      return;
    }
    await onVerify({
      contentType: "image",
      content: preview,
      url: urlValue.trim() || undefined,
      fileName: fileName || "upload.png",
      creatorId,
      creatorName
    });
  }

  useEffect(() => {
    if (textValue.trim() || preview) {
      setValidationError("");
    }
  }, [preview, textValue, urlValue]);

  useEffect(() => {
    if (contentType !== "image") return;
    onImageStateChange?.({ preview, fileName, imageUrl: urlValue.trim() || undefined });
  }, [contentType, fileName, onImageStateChange, preview, urlValue]);

  useEffect(() => {
    if (!onInputStateChange) return;

    if (contentType === "image") {
      onInputStateChange({ mode: "image", value: preview, fileName, preview, url: urlValue.trim() || undefined });
      return;
    }

    if (contentType === "video") {
      onInputStateChange({ mode: "video", value: urlValue.trim(), url: urlValue.trim() || undefined });
      return;
    }

    if (contentType === "url") {
      onInputStateChange({ mode: "url", value: urlValue.trim(), url: urlValue.trim() || undefined });
      return;
    }

    onInputStateChange({ mode: "text", value: textValue });
  }, [contentType, fileName, onInputStateChange, preview, textValue, urlValue]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`panel rounded-2xl p-5 sm:p-6 ${validationError ? "error-shake" : ""}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Analysis Input</p>
          <p className="mt-2 text-2xl font-semibold text-white">Analyze content</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Paste text or a URL, upload an image, or add a video link. TruthChain-X returns a score, verdict, and simple explanation.</p>
        </div>
        <div className="hidden rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 sm:block">Secure analysis</div>
      </div>

      <div className="mb-4 flex gap-2">
        {([
          { type: "text", label: "Text", icon: FileText },
          { type: "image", label: "Image", icon: ImagePlus },
          { type: "video", label: "Video", icon: PlayCircle },
          { type: "url", label: "URL", icon: Link2 }
        ] as const).map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => switchType(type)}
            className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
              contentType === type ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
          placeholder={contentType === "video" ? "Paste video URL..." : contentType === "url" ? "Paste website URL..." : "Optional source URL..."}
        />
      </div>

      {contentType === "text" ? (
        <div className="space-y-4">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className={`min-h-52 w-full rounded-lg border bg-slate-950/40 p-4 text-sm text-slate-100 outline-none transition ${validationError && contentType === "text" ? "border-rose-400/40 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_20px_rgba(244,63,94,0.12)]" : "border-white/10 focus:border-cyan-400/40"}`}
            placeholder="Paste suspicious text here..."
          />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <FileText className="h-4 w-4" />
              Preview
            </div>
            {textValue || "Preview will appear here."}
          </div>
        </div>
      ) : contentType === "url" ? (
        <div className="space-y-4">
          <div className={`rounded-2xl border bg-slate-950/40 p-4 transition ${validationError && contentType === "url" ? "border-rose-400/40" : "border-white/10"}`}>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <Link2 className="h-4 w-4" />
              Website URL
            </div>
            <p className="text-sm leading-7 text-slate-300">Paste a website link to check phishing patterns, public presence, SSL posture, and live search signals.</p>
          </div>
        </div>
      ) : contentType === "video" ? (
        <div className="space-y-4">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="min-h-40 w-full rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            placeholder="Optional context or transcript excerpt..."
          />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <PlayCircle className="h-4 w-4" />
              Video intelligence
            </div>
            We’ll inspect the link, extract available metadata, search the public web, and score clickbait or misinformation risk.
          </div>
        </div>
      ) : (
        <motion.div
          whileHover={{ y: -3 }}
          animate={dragging ? { boxShadow: "0 0 0 1px rgba(34,211,238,0.22), 0 0 42px rgba(34,211,238,0.16)" } : { boxShadow: "0 0 0 rgba(34,211,238,0)" }}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          className={`relative overflow-hidden rounded-lg border border-dashed p-8 text-center transition ${
            dragging
              ? "border-cyan-400 bg-cyan-400/10"
              : validationError && contentType === "image"
                ? "border-rose-400/40 bg-rose-400/[0.06]"
                : "border-white/15 bg-white/[0.03]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_45%)] opacity-70" />
          <div className="relative z-10">
            <UploadCloud className="mx-auto mb-4 h-10 w-10 text-cyan-200" />
            <p className="text-base font-medium text-white">Drag and drop your image</p>
            <p className="mt-2 text-sm text-slate-400">We'll check for manipulation patterns and build a phishing risk signature.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02]"
            >
              Choose file
            </motion.button>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
          </div>
        </motion.div>
      )}

      {contentType === "image" && preview ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-slate-950/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={fileName} className="h-64 w-full object-cover" />
        </div>
      ) : contentType === "image" ? (
        <div className="mt-5 rounded-lg border border-dashed border-white/10 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-400">
          Image preview will appear here after you upload a file.
        </div>
      ) : null}

      {validationError ? (
        <motion.div variants={scaleIn} initial="hidden" animate="visible" className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {validationError}
        </motion.div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <motion.button
          whileHover={loading ? undefined : { scale: 1.03, y: -1 }}
          whileTap={loading ? undefined : { scale: 0.97 }}
          onClick={submit}
          disabled={loading}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02] hover:shadow-[0_14px_38px_rgba(56,189,248,0.3)] disabled:opacity-60"
        >
          <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)] opacity-0 transition group-hover:opacity-100" />
          {loading ? <span className="gradient-spinner" /> : <ImagePlus className="h-4 w-4" />}
          {loading ? "Analyzing content..." : "Analyze"}
        </motion.button>
      </div>
    </motion.div>
  );
}
