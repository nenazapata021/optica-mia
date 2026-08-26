"use client";

import { useCallback, useRef, useState } from "react";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";

// Constantes locales - no modifican TRY_ON_CONFIG (10MB legacy intacto)
const CLIENT_PHOTO_CONFIG = {
  maxInputBytes: 5 * 1024 * 1024, // 5 MB antes de procesar
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  outputSize: 1024,
  marginRatio: 0.18, // igual que useCanvasRenderer.ts:347
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

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar PNG"));
      },
      "image/png"
    );
  });
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

      setStatus("detecting");

      // 4. Validar rostro con MediaPipe Tasks Vision (IMAGE mode)
      const engine = MediaPipeFaceMeshEngine.getInstance();
      if (!engine.isLoaded()) {
        await engine.load("IMAGE");
      }

      const result = engine.detectImage(img);
      if (!result) {
        const msg = "Ocurrió un error al procesar la imagen. Intenta con otra foto.";
        setStatus("error");
        setError(msg);
        return null;
      }

      const landmarks = engine.extractPreciseLandmarks(result);
      if (!landmarks) {
        const msg = "No pudimos detectar tu rostro. Usa una foto de frente, bien iluminada, sin tapar tu cara.";
        setStatus("error");
        setError(msg);
        return null;
      }

      // Múltiples rostros: el engine solo extrae el primero, pero si hay >1, advertimos
      if (result.faceLandmarks && result.faceLandmarks.length > 1) {
        const msg = "Solo debe aparecer una persona en la foto.";
        setStatus("error");
        setError(msg);
        return null;
      }

      setStatus("processing");

      // 5. Crop centrado en rostro -> 1024x1024 PNG (lógica idéntica a useCanvasRenderer.ts:349-392)
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const faceOval = landmarks.faceOval;

      if (!faceOval || faceOval.length === 0) {
        const msg = "No pudimos delimitar tu rostro. Intenta con otra foto.";
        setStatus("error");
        setError(msg);
        return null;
      }

      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const pt of faceOval) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      const faceWidthNorm = maxX - minX;
      const faceHeightNorm = maxY - minY;
      const faceCenterXNorm = (minX + maxX) / 2;
      const faceCenterYNorm = (minY + maxY) / 2;

      const cropWidthNorm = faceWidthNorm * (1 + 2 * CLIENT_PHOTO_CONFIG.marginRatio);
      const cropHeightNorm = faceHeightNorm * (1 + 2 * CLIENT_PHOTO_CONFIG.marginRatio);
      const cropSizeNorm = Math.max(cropWidthNorm, cropHeightNorm);

      let cropLeft = faceCenterXNorm - cropSizeNorm / 2;
      let cropTop = faceCenterYNorm - cropSizeNorm / 2;

      // Clamp a bordes 0-1
      if (cropLeft < 0) cropLeft = 0;
      if (cropTop < 0) cropTop = 0;
      if (cropLeft + cropSizeNorm > 1) cropLeft = 1 - cropSizeNorm;
      if (cropTop + cropSizeNorm > 1) cropTop = 1 - cropSizeNorm;

      const sx = Math.round(cropLeft * srcW);
      const sy = Math.round(cropTop * srcH);
      const sWidth = Math.round(cropSizeNorm * srcW);
      const sHeight = Math.round(cropSizeNorm * srcH);

      // Guard contra recorte degenerado
      const safeSWidth = Math.max(1, sWidth);
      const safeSHeight = Math.max(1, sHeight);

      const canvas = document.createElement("canvas");
      canvas.width = CLIENT_PHOTO_CONFIG.outputSize;
      canvas.height = CLIENT_PHOTO_CONFIG.outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const msg = "No se pudo inicializar el procesador de imagen.";
        setStatus("error");
        setError(msg);
        return null;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, safeSWidth, safeSHeight, 0, 0, CLIENT_PHOTO_CONFIG.outputSize, CLIENT_PHOTO_CONFIG.outputSize);

      const blob = await canvasToPngBlob(canvas);

      // Advertencia si PNG supera ~2MB (PNG es lossless, no hay quality param)
      if (blob.size > CLIENT_PHOTO_CONFIG.maxOutputBytes) {
        // No bloqueamos, solo informamos. 1024 PNG suele estar 1-3MB.
        console.warn(`[useClientPhotoProcessor] PNG 1024 supera 2MB: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      }

      const previewUrl = URL.createObjectURL(blob);
      previewUrlRef.current = previewUrl;

      const resultProcessed: ProcessedPhoto = {
        blob,
        previewUrl,
        width: CLIENT_PHOTO_CONFIG.outputSize,
        height: CLIENT_PHOTO_CONFIG.outputSize,
        sizeBytes: blob.size,
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
