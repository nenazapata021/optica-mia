"use client";

import { useState, useCallback, useRef } from "react";
import { loadFaceLandmarker, detectFaceFromImageSource, isFaceLandmarkerLoaded } from "../services/faceDetection";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { FaceLandmarks, OverlayConfig } from "../types/tryOn";

interface UseFaceDetectionReturn {
  detectFromImage: (src: string) => Promise<
    { landmarks: FaceLandmarks; overlay: OverlayConfig } | { error: string }
  >;
  isModelLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;
  loadModel: () => Promise<string | null>;
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isModelLoaded, setIsModelLoaded] = useState(isFaceLandmarkerLoaded());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadPromiseRef = useRef<Promise<string | null> | null>(null);

  const loadModel = useCallback(async (): Promise<string | null> => {
    if (isFaceLandmarkerLoaded()) {
      setIsModelLoaded(true);
      return null;
    }

    if (loadPromiseRef.current) return loadPromiseRef.current;

    setIsLoading(true);
    setLoadError(null);

    loadPromiseRef.current = (async () => {
      try {
        await loadFaceLandmarker();
        setIsModelLoaded(true);
        setIsLoading(false);
        return null;
      } catch (err) {
        const msg = err instanceof Error
          ? `Error al cargar el modelo: ${err.message}`
          : TRY_ON_CONFIG.messages.modelError;
        setLoadError(msg);
        setIsLoading(false);
        return msg;
      }
    })();

    return loadPromiseRef.current;
  }, []);

  const detectFromImage = useCallback(
    async (src: string): Promise<
      { landmarks: FaceLandmarks; overlay: OverlayConfig } | { error: string }
    > => {
      if (!isFaceLandmarkerLoaded()) {
        return { error: TRY_ON_CONFIG.messages.modelError };
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      return new Promise((resolve) => {
        img.onload = async () => {
          if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
            resolve({ error: TRY_ON_CONFIG.messages.imageNotReady });
            return;
          }
          try {
            const result = await detectFaceFromImageSource(img);
            resolve(result);
          } catch {
            resolve({ error: TRY_ON_CONFIG.messages.detectionError });
          }
        };
        img.onerror = () => {
          resolve({ error: "No se pudo cargar la imagen." });
        };
        img.src = src;
      });
    },
    [],
  );

  return { detectFromImage, isModelLoaded, isLoading, loadError, loadModel };
}
