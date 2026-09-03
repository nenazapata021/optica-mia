"use client";

import { useCallback, useRef, useState } from "react";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { normalizeImage } from "@/lib/normalizeImage";

const CLIENT_PHOTO_CONFIG = {
  maxInputBytes: 5 * 1024 * 1024, // 5 MB antes de procesar
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  outputSize: 1024,
  marginRatio: 0.18,
  maxOutputBytes: 2 * 1024 * 1024, // ~2 MB objetivo PNG
} as const;

export type ProcessorStatus = "idle" | "validating" | "detecting" | "processing" | "ready" | "error";

export interface ProcessedPhoto {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface UseClientPhotoProcessorReturn {
  status: ProcessorStatus;
  error: string | null;
  processed: ProcessedPhoto | null;
  processFile: (file: File) => Promise<ProcessedPhoto | null>;
  reset: () => void;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

/**
 * Intenta detectar el rostro y devolver el centro normalizado (0-1).
 * Si no detecta rostro, devuelve null (se usará centro de imagen).
 */
async function detectFaceCenter(img: HTMLImageElement): Promise<{ x: number; y: number } | null> {
  try {
    const engine = MediaPipeFaceMeshEngine.getInstance();
    if (!engine.isLoaded()) {
      await engine.load("IMAGE");
    }

    const result = engine.detectImage(img);
    if (!result) return null;

    const landmarks = engine.extractPreciseLandmarks(result);
    if (!landmarks) return null;

    if (result.faceLandmarks && result.faceLandmarks.length > 1) {
      throw new Error("Solo debe aparecer una persona en la foto.");
    }

    const faceOval = landmarks.faceOval;
    if (!faceOval || faceOval.length === 0) return null;

    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const pt of faceOval) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  } catch {
    return null;
  }
}

export function useClientPhotoProcessor(): UseClientPhotoProcessorReturn {
  const [status, setStatus] = useState<ProcessorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState<ProcessedPhoto | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setStatus("idle");
    setError(null);
    setProcessed(null);
  }, []);

  const processFile = useCallback(async (file: File): Promise<ProcessedPhoto | null> => {
    // Limpieza previa
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setProcessed(null);
    setError(null);

    // 1. Validación formato
    if (!(CLIENT_PHOTO_CONFIG.acceptedTypes as readonly string[]).includes(file.type)) {
      const msg = "Formato no permitido. Usa JPG, PNG o WEBP.";
      setStatus("error");
      setError(msg);
      return null;
    }

    // 2. Validación tamaño 5MB
    if (file.size > CLIENT_PHOTO_CONFIG.maxInputBytes) {
      const actual = (file.size / (1024 * 1024)).toFixed(1);
      const msg = `Archivo excede 5 MB (actual: ${actual} MB). Elige una imagen más liviana.`;
      setStatus("error");
      setError(msg);
      return null;
    }

    try {
      setStatus("validating");

      // 3. Cargar imagen
      const img = await loadImageFromFile(file);

      // Validar tamaño intrínseco mínimo
      if (img.naturalWidth < 256 || img.naturalHeight < 256) {
        const msg = `La imagen es demasiado pequeña (${img.naturalWidth}×${img.naturalHeight}px). Usa una foto de al menos 256×256 píxeles.`;
        setStatus("error");
        setError(msg);
        return null;
      }

      setStatus("detecting");

      // 4. Detectar rostro para centrar el crop
      let faceCenter: { x: number; y: number } | null = null;
      try {
        faceCenter = await detectFaceCenter(img);
      } catch (e) {
        // Error de múltiples rostros — propagar
        if (e instanceof Error && e.message.includes("una persona")) {
          const msg = e.message;
          setStatus("error");
          setError(msg);
          return null;
        }
        // Otros errores: continuar con centro de imagen
      }

      setStatus("processing");

      // 5. Normalizar a 1024×1024 cuadrado (cover crop centrado)
      const result = await normalizeImage(
        file,
        CLIENT_PHOTO_CONFIG.outputSize,
        faceCenter ?? undefined,
      );

      // 6. Advertencia si PNG supera ~2MB
      if (result.sizeBytes > CLIENT_PHOTO_CONFIG.maxOutputBytes) {
        console.warn(
          `[useClientPhotoProcessor] PNG 1024 supera 2MB: ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`
        );
      }

      const previewUrl = URL.createObjectURL(result.blob);
      previewUrlRef.current = previewUrl;

      const resultProcessed: ProcessedPhoto = {
        blob: result.blob,
        previewUrl,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
      };

      setProcessed(resultProcessed);
      setStatus("ready");
      setError(null);
      return resultProcessed;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ocurrió un error al procesar la imagen. Intenta con otra foto.";
      setStatus("error");
      setError(msg);
      return null;
    }
  }, []);

  return { status, error, processed, processFile, reset };
}
