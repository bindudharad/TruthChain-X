"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { FileText, ImagePlus, UploadCloud, Video } from "lucide-react";
import { motion } from "framer-motion";
import { ContentType } from "@/lib/types";

type UploadPayload = {
  type: ContentType;
  content: string;
  fileName: string;
  preview: string;
};

export function UploadZone({ onSubmit, loading }: { onSubmit: (payload: UploadPayload) => Promise<void>; loading: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType>("text");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");

  const icon = useMemo(() => {
    if (selectedType === "image") return <ImagePlus className="h-5 w-5" />;
    if (selectedType === "video") return <Video className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  }, [selectedType]);

  async function readFile(file: File) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = window.btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;
    setSelectedType(file.type.startsWith("image") ? "image" : "video");
    setPreview(dataUrl);
    setFileName(file.name);
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await readFile(files[0]);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    await handleFiles(event.dataTransfer.files);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    await handleFiles(event.target.files);
  }

  async function handleSubmit() {
    if (selectedType === "text") {
      if (!textValue.trim()) return;
      await onSubmit({ type: "text", content: textValue, fileName: "text-claim.txt", preview: textValue });
      return;
    }
    if (!preview) return;
    await onSubmit({ type: selectedType, content: preview, fileName, preview });
  }

  return (
    <div className="panel rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Analyze content</p>
          <p className="mt-1 text-sm text-slate-400">Drop text, images, or video for a truth assessment and blockchain proof.</p>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">{icon}</div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["text", "image", "video"] as ContentType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
              selectedType === type ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {selectedType === "text" ? (
        <div className="space-y-4">
          <textarea
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            className="min-h-44 w-full rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            placeholder="Paste a claim, transcript, or caption to verify..."
          />
          {textValue ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">Preview</p>
              {textValue}
            </div>
          ) : null}
        </div>
      ) : (
        <motion.div
          whileHover={{ y: -4 }}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          className={`relative overflow-hidden rounded-lg border border-dashed p-8 text-center transition ${
            dragging ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_50px_rgba(34,211,238,0.18)]" : "border-white/15 bg-white/[0.03]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_45%)] opacity-70" />
          <div className="relative z-10">
            <UploadCloud className="mx-auto mb-4 h-10 w-10 text-cyan-200" />
            <p className="text-base font-medium">Drag and drop your {selectedType}</p>
            <p className="mt-2 text-sm text-slate-400">Inspect for manipulation clues, synthetic tells, and provenance risk.</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02]"
            >
              Choose file
            </button>
            <input ref={inputRef} type="file" accept={selectedType === "image" ? "image/*" : "video/*"} onChange={handleFileChange} className="hidden" />
          </div>
        </motion.div>
      )}

      {preview ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-slate-950/30">
          {selectedType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={fileName} className="h-64 w-full object-cover" />
          ) : (
            <video src={preview} controls className="h-64 w-full bg-black object-contain" />
          )}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Verify Content"}
        </button>
        <button
          onClick={() => {
            setTextValue("");
            setPreview("");
            setFileName("");
          }}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
