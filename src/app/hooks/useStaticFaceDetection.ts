"use client";

import { useState, useCallback, useRef } from "react";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { OverlayConfig } from "../types/tryOn";

interface UseStaticFaceDetectionReturn {
  detectFromImage: (image: HTMLImageElement) => Promise<OverlayConfig | null>;
  isLoading: boolean;
  error: string | null;
}

export function useStaticFaceDetection(): UseStaticFaceDetectionReturn {
  const engineRef = useRef<MediaPipeFaceMeshEngine | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureModel = useCallback(async (): Promise<boolean> => {
    if (engineRef.current?.isLoaded()) return true;
    if (loadPromiseRef.current) {
      await loadPromiseRef.current;
      return engineRef.current?.isLoaded() ?? false;
    }

    setIsLoading(true);
    setError(null);

    loadPromiseRef.current = (async () => {
      try {
        const engine = MediaPipeFaceMeshEngine.getInstance();
        await engine.load("IMAGE");
        engineRef.current = engine;
      } catch {
        setError(TRY_ON_CONFIG.messages.modelError);
      } finally {
        setIsLoading(false);
      }
    })();

    await loadPromiseRef.current;
    return engineRef.current?.isLoaded() ?? false;
  }, []);

  const detectFromImage = useCallback(
    async (image: HTMLImageElement): Promise<OverlayConfig | null> => {
      const ready = await ensureModel();
      if (!ready) return null;

      const engine = engineRef.current!;
      const result = engine.detectImage(image);
      if (!result) return null;

      const landmarks = engine.extractPreciseLandmarks(result);
      if (!landmarks) {
        setError(TRY_ON_CONFIG.messages.noFace);
        return null;
      }

      const nw = image.naturalWidth;
      const nh = image.naturalHeight;

      landmarks.imageWidth = nw;
      landmarks.imageHeight = nh;

      const eyeDX = landmarks.rightEye.x - landmarks.leftEye.x;
      const eyeDY = landmarks.rightEye.y - landmarks.leftEye.y;
      const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY) * nw;
      const glassesWidth = eyeDistance * TRY_ON_CONFIG.faceMeshEngine.glassesWidthMultiplier;

      const overlay = engine.calculateGlassesOverlay(
        landmarks, nw, nh, glassesWidth, glassesWidth * 0.35,
      );

      setError(null);
      return overlay;
    },
    [ensureModel],
  );

  return { detectFromImage, isLoading, error };
}
