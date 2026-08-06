"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { OverlayConfig } from "../types/tryOn";

interface UseFaceLandmarksReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayConfig: OverlayConfig | null;
  isDetecting: boolean;
  isLoading: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

function lerp(prev: number, target: number, factor: number): number {
  return prev + (target - prev) * (1 - factor);
}

function smoothOverlay(prev: OverlayConfig | null, next: OverlayConfig, factor: number): OverlayConfig {
  if (!prev) return next;
  return {
    centerX: lerp(prev.centerX, next.centerX, factor),
    centerY: lerp(prev.centerY, next.centerY, factor),
    rotation: lerp(prev.rotation, next.rotation, factor),
    glassesWidth: lerp(prev.glassesWidth, next.glassesWidth, factor),
    glassesHeight: lerp(prev.glassesHeight, next.glassesHeight, factor),
    scale: lerp(prev.scale, next.scale, factor),
    eyeDistance: next.eyeDistance,
    verticalOffset: next.verticalOffset,
  };
}

export function useFaceLandmarks(): UseFaceLandmarksReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const prevOverlayRef = useRef<OverlayConfig | null>(null);
  const engineRef = useRef<MediaPipeFaceMeshEngine | null>(null);
  const isRunningRef = useRef(false);

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLoop = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    const video = videoRef.current;
    const engine = engineRef.current;

    if (video && engine && video.readyState >= 2) {
      const result = engine.detectVideo(video, timestamp);

      if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
        const rawLandmarks = engine.extractPreciseLandmarks(result);

        if (rawLandmarks) {
          const nw = video.videoWidth;
          const nh = video.videoHeight;

          rawLandmarks.imageWidth = nw;
          rawLandmarks.imageHeight = nh;

          const eyeDX = rawLandmarks.rightEye.x - rawLandmarks.leftEye.x;
          const eyeDY = rawLandmarks.rightEye.y - rawLandmarks.leftEye.y;
          const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY) * nw;
          const glassesWidth = eyeDistance * TRY_ON_CONFIG.faceMeshEngine.glassesWidthMultiplier;

          const overlay = engine.calculateGlassesOverlay(
            rawLandmarks, nw, nh, glassesWidth, glassesWidth * 0.35,
          );

          const factor = TRY_ON_CONFIG.video.smoothing.factor;
          const smoothed = smoothOverlay(prevOverlayRef.current, overlay, factor);
          prevOverlayRef.current = smoothed;

          setOverlayConfig(smoothed);
          setIsDetecting(true);
        } else {
          setIsDetecting(false);
        }
      } else {
        setIsDetecting(false);
      }
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const engine = MediaPipeFaceMeshEngine.getInstance();
      await engine.load("VIDEO");
      engineRef.current = engine;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { ...TRY_ON_CONFIG.camera },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      setIsLoading(false);
      isRunningRef.current = true;
      prevOverlayRef.current = null;
      animFrameRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      setIsLoading(false);
      isRunningRef.current = false;
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(TRY_ON_CONFIG.messages.cameraDenied);
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError(TRY_ON_CONFIG.messages.cameraNotFound);
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError(TRY_ON_CONFIG.messages.cameraInUse);
      } else {
        setError(TRY_ON_CONFIG.messages.cameraError);
      }
    }
  }, [detectLoop]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    prevOverlayRef.current = null;
    setOverlayConfig(null);
    setIsDetecting(false);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, overlayConfig, isDetecting, isLoading, error, start, stop };
}
