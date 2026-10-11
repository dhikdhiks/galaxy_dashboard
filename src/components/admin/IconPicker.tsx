"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { ICON_CHOICES, isCustomIcon } from "@/components/icons";
import { inputClass } from "./fields";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
const MAX_BYTES = 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const toggleClass = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-purple-strong text-background"
      : "text-muted hover:text-foreground"
  }`;

/**
 * Icon field with two modes: pick a built-in glyph or upload an
 * image (inlined as a data URL). The hidden input always carries
 * the current value; a picked file is submitted as `iconFile` and
 * wins on the server.
 */
export function IconPicker({
  id,
  name,
  value,
}: {
  id: string;
  name: string;
  value?: string | null;
}) {
  const initial = value ?? "";
  const hasImage = isCustomIcon(initial);
  const [mode, setMode] = useState<"default" | "upload">(
    hasImage ? "upload" : "default",
  );
  const [identifier, setIdentifier] = useState(hasImage ? "" : initial);
  const [preview, setPreview] = useState<string | null>(
    hasImage ? initial : null,
  );
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the picker in sync when the stored icon changes (the
  // parent refetches right after a save). Adjusting state during
  // render — instead of in an effect — lets React re-render
  // before committing, so the UI never flashes stale values.
  const [syncedValue, setSyncedValue] = useState(initial);
  if (initial !== syncedValue) {
    setSyncedValue(initial);
    if (isCustomIcon(initial)) {
      setMode("upload");
      setIdentifier("");
      setPreview(initial);
    } else {
      setMode("default");
      setIdentifier(initial);
      setPreview(null);
    }
    setFileName("");
    setError(null);
  }

  // Revoke object URLs when replaced or unmounted; data URLs
  // pass through untouched.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Reset together with the surrounding form: `form.reset()`
  // fires a native `reset` event on the form, so subscribe to
  // it here and restore the stored value.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const handleReset = () => {
      if (hasImage) {
        setMode("upload");
        setIdentifier("");
        setPreview(initial);
      } else {
        setMode("default");
        setIdentifier("");
        setPreview(null);
      }
      setFileName("");
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [hasImage, initial]);

  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName("");
    setError(null);
    // Fall back to the stored image, if any, otherwise no preview.
    setPreview(hasImage ? initial : null);
  }

  function handleFile(file: File | undefined) {
    if (!file || file.size === 0) {
      clearFile();
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setError(
        "Format tidak didukung. Gunakan PNG, JPEG, WebP, GIF, atau SVG.",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File terlalu besar — maksimal 1 MB.");
      return;
    }
    setPreview((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setError(null);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Icon source"
        className="surface inline-flex w-max rounded-lg p-1"
      >
        <button
          type="button"
          onClick={() => setMode("default")}
          aria-pressed={mode === "default"}
          className={toggleClass(mode === "default")}
        >
          Bawaan
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          aria-pressed={mode === "upload"}
          className={toggleClass(mode === "upload")}
        >
          Upload
        </button>
      </div>

      {mode === "default" ? (
        <select
          id={id}
          name={name}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className={inputClass}
        >
          <option value="">Default (sparkle)</option>
          {ICON_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            name="iconFile"
            accept={ACCEPT}
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="w-max cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-strong/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-purple"
            aria-label="Upload icon image"
          />
          {preview ? (
            <div className="flex items-center gap-3">
              {/* Blob/data URLs cannot go through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview icon"
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-xs text-muted">
                  {fileName || "Icon saat ini"}
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="inline-flex w-max items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Belum ada gambar dipilih
            </p>
          )}
        </div>
      )}

      {/* Always submitted: the identifier in default mode, the
          stored data URL in upload mode. A picked file
          (iconFile) overrides this on the server. */}
      <input
        type="hidden"
        name={name}
        value={mode === "default" ? identifier : hasImage ? initial : ""}
      />

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
