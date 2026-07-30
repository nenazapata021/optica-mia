"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { TRY_ON_CONFIG } from "../config/tryOn";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  cameraError: string | null;
  isCameraActive: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraActive(false);
    setCameraError(null);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { ...TRY_ON_CONFIG.camera },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      stopCamera();
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError(TRY_ON_CONFIG.messages.cameraDenied);
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError(TRY_ON_CONFIG.messages.cameraNotFound);
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setCameraError(TRY_ON_CONFIG.messages.cameraInUse);
      } else {
        setCameraError(TRY_ON_CONFIG.messages.cameraError);
      }
    }
  }, [stopCamera]);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  return { videoRef, streamRef, cameraError, isCameraActive, startCamera, stopCamera, capturePhoto };
}
