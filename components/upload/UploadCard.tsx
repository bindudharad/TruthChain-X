"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { scaleIn } from "@/animations/presets";

type VerifyPayload = {
  contentType: "text" | "image";
  content: string;
  fileName: string;
  demoMode: boolean;
  creatorId: string;
  creatorName: string;
};

export function UploadCard({
  loading,
  demoMode,
  onDemoModeChange,
  onVerify
}: {
  loading: boolean;
  demoMode: boolean;
  onDemoModeChange: (value: boolean) => void;
  onVerify: (payload: VerifyPayload) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [contentType, setContentType] = useState<"text" | "image">("text");
  const [textValue, setTextValue] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [creatorId, setCreatorId] = useState("creator_demo");
  const [creatorName, setCreatorName] = useState("Demo Creator");
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (contentType === "text") {
      setDragging(false);
    }
  }, [contentType]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result || ""));
      setFileName(file.name);
      setContentType("image");
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

  function switchType(nextType: "text" | "image") {
    setContentType(nextType);
    setValidationError("");
    if (nextType === "text") {
      setPreview("");
      setFileName("");
    } else {
      setTextValue("");
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
        fileName: "claim.txt",
        demoMode,
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
      fileName: fileName || "upload.png",
      demoMode,
      creatorId,
      creatorName
    });
  }

  useEffect(() => {
    if (textValue.trim() || preview) {
      setValidationError("");
    }
  }, [preview, textValue]);

  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} className={`panel panel-hover rounded-lg p-5 sm:p-6 ${validationError ? "error-shake" : ""}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Content intake</p>
          <p className="mt-2 text-2xl font-semibold text-white">Verify suspicious content</p>
          <p className="mt-2 text-sm text-slate-400">Drop a viral image or paste a suspicious claim to generate a trust fingerprint.</p>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          <input type="checkbox" checked={demoMode} onChange={(e) => onDemoModeChange(e.target.checked)} />
          Demo Mode ON
        </label>
      </div>

      <div className="mb-4 flex gap-2">
        {(["text", "image"] as const).map((type) => (
          <button
            key={type}
            onClick={() => switchType(type)}
            className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
              contentType === type ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <input
          value={creatorId}
          onChange={(e) => setCreatorId(e.target.value)}
          className="h-11 rounded-lg border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
          placeholder="Creator ID"
        />
        <input
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          className="h-11 rounded-lg border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
          placeholder="Display name"
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
            <p className="mt-2 text-sm text-slate-400">We'll check for manipulation patterns and build a trust fingerprint.</p>
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
          {loading ? "Analyzing..." : "Verify Content"}
        </motion.button>
      </div>
    </motion.div>
  );
}
