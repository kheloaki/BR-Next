"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { btnGhost, inputClass, labelClass } from "@/components/admin/admin-form-styles";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export function ProjectDocumentUpload({
  label,
  value,
  onChange,
  uploadPrefix,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadPrefix: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format accepté : PDF ou image (JPEG, PNG, WebP).");
      return;
    }
    setUploading(true);
    try {
      const presignRes = await fetch("/api/media/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          filename: file.name,
          prefix: uploadPrefix,
        }),
      });
      if (!presignRes.ok) {
        const err = (await presignRes.json()) as { error?: string };
        throw new Error(err.error || "Impossible de préparer l'envoi.");
      }
      const { uploadUrl, publicUrl } = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl?: string;
      };
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Échec du téléversement.");
      if (!publicUrl) throw new Error("URL publique indisponible — vérifiez la config R2.");
      onChange(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de téléversement.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fileName = value ? value.split("/").pop() : null;

  return (
    <div>
      <p className={labelClass}>{label}</p>
      {value ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-[var(--background)] px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-[var(--navy)]" aria-hidden />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--navy)] underline underline-offset-2"
          >
            {fileName || "Voir le document"}
          </a>
          <button
            type="button"
            className={btnGhost}
            disabled={disabled || uploading}
            onClick={() => onChange("")}
            aria-label="Retirer le document"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-1.5">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            className={`${inputClass} flex w-full items-center justify-center gap-2 border-dashed py-3 text-sm text-[var(--graphite)]/80`}
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Envoi en cours…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden />
                Choisir un fichier (PDF ou image)
              </>
            )}
          </button>
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
