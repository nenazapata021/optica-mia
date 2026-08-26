"use client";

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload, LoaderCircle, ImageOff, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useClientPhotoProcessor } from "../hooks/useClientPhotoProcessor";
import { uploadClientPhoto } from "../lib/clientPhotoUpload";

interface ClientPhotoUploaderProps {
  customerId: string;
  onSuccess?: (url: string) => void;
  onError?: (message: string) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function ClientPhotoUploader({ customerId, onSuccess, onError }: ClientPhotoUploaderProps) {
  const { status: procStatus, error: procError, processed, processFile, reset } = useClientPhotoProcessor();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const clearRawPreview = useCallback(() => {
    if (rawPreviewUrl) {
      URL.revokeObjectURL(rawPreviewUrl);
      setRawPreviewUrl(null);
    }
  }, [rawPreviewUrl]);

  const handleReset = useCallback(() => {
    clearRawPreview();
    reset();
    setUploadStatus("idle");
    setUploadError(null);
    setUploadedUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [clearRawPreview, reset]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!customerId) {
        const msg = "Debes iniciar sesión para subir tu foto.";
        setUploadError(msg);
        onError?.(msg);
        return;
      }

      // Preview inmediato antes de confirmar (requisito 1)
      const rawUrl = URL.createObjectURL(file);
      setRawPreviewUrl(rawUrl);
      setUploadStatus("idle");
      setUploadError(null);
      setUploadedUrl(null);

      const result = await processFile(file);
      // processFile ya maneja validación 5MB, formato, rostro
      if (!result) {
        // error queda en procError, se muestra en UI
        URL.revokeObjectURL(rawUrl);
        setRawPreviewUrl(null);
        return;
      }

      // Mantener rawPreview hasta confirmar subida, luego mostrar processed
      // No limpiamos rawPreview aquí para transición suave
    },
    [customerId, onError, processFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!processed || !customerId) return;
    setUploadStatus("uploading");
    setUploadError(null);
    try {
      const url = await uploadClientPhoto(processed.blob, customerId);
      setUploadedUrl(url);
      setUploadStatus("success");
      clearRawPreview();
      onSuccess?.(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar tu foto. Intenta de nuevo.";
      setUploadStatus("error");
      setUploadError(msg);
      onError?.(msg);
    }
  }, [processed, customerId, onSuccess, onError, clearRawPreview]);

  const isProcessing = procStatus === "validating" || procStatus === "detecting" || procStatus === "processing";
  const showProcessedPreview = processed && (procStatus === "ready" || uploadStatus !== "idle");
  const displayPreviewUrl = showProcessedPreview ? processed.previewUrl : rawPreviewUrl;

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir foto - arrastra o haz clic para seleccionar"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer
          ${isDragging ? "border-[#008294] bg-[#e0f2f4]" : "border-slate-300 bg-white hover:border-[#008294] hover:bg-slate-50"}
          ${isProcessing || uploadStatus === "uploading" ? "pointer-events-none opacity-70" : ""}
        `}
      >
        {displayPreviewUrl ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayPreviewUrl}
              alt="Preview"
              className="mx-auto h-48 w-48 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
            {showProcessedPreview && (
              <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                1024×1024
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="absolute -top-2 -left-2 rounded-full bg-white p-1 shadow border border-slate-200 hover:bg-slate-50"
              aria-label="Quitar foto"
            >
              <X size={14} className="text-slate-600" />
            </button>
          </div>
        ) : (
          <>
            <div className={`rounded-full p-3 ${isDragging ? "bg-[#008294] text-white" : "bg-slate-100 text-slate-500"}`}>
              <Upload size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Arrastra tu foto aquí o <span className="text-[#008294] underline">selecciona archivo</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">JPG, PNG o WEBP — máx 5 MB</p>
            </div>
          </>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-sm">
            <LoaderCircle size={28} className="animate-spin text-[#008294]" />
            <p className="text-sm font-medium text-slate-700">
              {procStatus === "validating" && "Validando archivo..."}
              {procStatus === "detecting" && "Detectando rostro..."}
              {procStatus === "processing" && "Recortando a 1024×1024..."}
            </p>
          </div>
        )}
      </div>

      {/* Info peso final PNG */}
      {processed && procStatus === "ready" && (
        <p className="mt-2 text-center text-xs text-slate-500">
          PNG 1024×1024 — {(processed.sizeBytes / 1024).toFixed(0)} KB
          {processed.sizeBytes > 2 * 1024 * 1024 && " (supera 2 MB, se subirá de todos modos)"}
        </p>
      )}

      {/* Errores validación/procesamiento */}
      {procError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
          <ImageOff size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{procError}</p>
        </div>
      )}

      {/* Botón confirmar subida (solo cuando hay processed listo) */}
      {processed && procStatus === "ready" && uploadStatus !== "success" && (
        <button
          onClick={handleConfirmUpload}
          disabled={uploadStatus === "uploading" || !customerId}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#008294] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#005f6b] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploadStatus === "uploading" ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Subiendo a PostgreSQL...
            </>
          ) : (
            <>
              <Upload size={18} />
              Confirmar y subir (PNG)
            </>
          )}
        </button>
      )}

      {/* Estado subida */}
      {uploadStatus === "success" && uploadedUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3">
          <CheckCircle2 size={18} className="text-green-600" />
          <p className="text-sm text-green-800 break-all">
            ¡Foto guardada! Lista para el Probador Virtual.
            <br />
            <span className="text-xs text-green-600">{uploadedUrl}</span>
          </p>
        </div>
      )}

      {uploadStatus === "error" && uploadError && (
        <div className="mt-3">
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
          <button
            onClick={handleConfirmUpload}
            className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reintentar subida
          </button>
        </div>
      )}

      {!customerId && (
        <p className="mt-3 text-center text-xs text-amber-600">Debes iniciar sesión para subir tu foto (email único requerido).</p>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-400">
        La imagen se procesa en tu dispositivo (canvas 1024×1024 centrado en rostro) y solo se sube el PNG ya optimizado.
      </p>
    </div>
  );
}
