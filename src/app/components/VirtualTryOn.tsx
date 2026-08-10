"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LoaderCircle, Upload, Download, ImageOff, Video, Camera } from "lucide-react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { FaceLandmarks, OverlayConfig, RunningMode } from "../types/tryOn";
import type { Producto } from "../types/producto";

interface VirtualTryOnProps {
  glassesImageUrl: string;
  faceSrc?: string;
  scaleMultiplier?: number;
  producto?: Producto;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export default function VirtualTryOn({ glassesImageUrl, faceSrc, scaleMultiplier, producto }: VirtualTryOnProps) {
  const { canvasRef, drawImageFrame, download, clear } = useCanvasRenderer();

  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<OverlayConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceDetected, setFaceDetected] = useState<FaceLandmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasFace, setHasFace] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarksRef = useRef<FaceLandmarks | null>(null);
  const overlayConfigRef = useRef<OverlayConfig | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(glassesImageUrl).then((img) => {
      if (!cancelled) loadedImageRef.current = img;
    });
    return () => { cancelled = true; };
  }, [glassesImageUrl]);

  useEffect(() => {
    if (!faceSrc || faceSrc === "") return;
    let cancelled = false;
    loadImage(faceSrc).then((img) => {
      if (!cancelled) {
        setUploadedImage(img);
        const engine = MediaPipeFaceMeshEngine.getInstance();
        const result = engine.detectImage(img);
        if (result) {
          const landmarks = engine.extractPreciseLandmarks(result);
          if (landmarks) {
            faceLandmarksRef.current = landmarks;
            overlayConfigRef.current = engine.calculateGlassesOverlay(
              landmarks,
              landmarks.imageWidth,
              landmarks.imageHeight,
              1,
              1,
            );
            setOverlay(overlayConfigRef.current);
            setHasFace(true);
          }
        }
      }
    });
    return () => { cancelled = true; };
  }, [faceSrc]);

  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;
    if (videoRef.current.readyState < 2) return;

    let animFrameId: number;
    const detectVideoFrame = () => {
      const engine = MediaPipeFaceMeshEngine.getInstance();
      const result = engine.detectVideo(videoRef.current, performance.now());
      if (result) {
        const landmarks = engine.extractPreciseLandmarks(result);
        if (landmarks) {
          faceLandmarksRef.current = landmarks;
          const overlay = engine.calculateGlassesOverlay(
            landmarks,
            landmarks.imageWidth,
            landmarks.imageHeight,
            1,
            1,
          );
          overlayConfigRef.current = overlay;
          setFaceDetected(landmarks);
          setOverlay(overlay);
        }
      }
      animFrameId = requestAnimationFrame(detectVideoFrame);
    };
    animFrameId = requestAnimationFrame(detectVideoFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const video = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = video;
      }
      setStream(video);
      setIsCameraActive(true);
      setIsDetecting(true);
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraActive(false);
    setIsDetecting(false);
    cancelAnimationFrame(animFrameRef.current);
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
      <canvas ref={canvasRef} className="block h-full w-full object-contain" />

      {!uploadedImage && !isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <ImageOff size={40} className="text-slate-400" />
          <p className="max-w-xs text-center text-sm text-slate-300">
            Sube una foto frontal para probar la montura.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
            <Upload size={18} />
            Subir foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const img = new Image();
                img.onload = () => {
                  setUploadedImage(img);
                  const engine = MediaPipeFaceMeshEngine.getInstance();
                  const result = engine.detectImage(img);
                  if (result) {
                    const landmarks = engine.extractPreciseLandmarks(result);
                    if (landmarks) {
                      overlayConfigRef.current = engine.calculateGlassesOverlay(
                        landmarks,
                        landmarks.imageWidth,
                        landmarks.imageHeight,
                        1,
                        1,
                      );
                      setOverlay(overlayConfigRef.current);
                      setHasFace(true);
                    }
                  }
                };
                img.src = URL.createObjectURL(file);
              }}
            />
          </label>
        </div>
      )}

      {isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <Video
            ref={videoRef}
            playsWhenPlaybackActive
            className="max-w-md rounded-xl border border-[#005f6b] object-contain"
          />
          <button
            onClick={startCamera}
            className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
            <Camera size={18} />
            {isCameraActive ? "Detener cámara" : "Iniciar cámara"}
          </button>
        </div>
      )}

      {uploadedImage && overlay && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Resultado
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={18} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Analizando rostro...</span>
          </div>
        </div>
      )}

      {error && !isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
            <ImageOff size={32} className="text-red-500" />
            <p className="max-w-xs text-sm text-slate-700">{error}</p>
            <p className="text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
              <Upload size={18} />
              Subir otra foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const img = new Image();
                  img.onload = () => {
                    setUploadedImage(img);
                    const engine = MediaPipeFaceMeshEngine.getInstance();
                    const result = engine.detectImage(img);
                    if (result) {
                      const landmarks = engine.extractPreciseLandmarks(result);
                      if (landmarks) {
                        overlayConfigRef.current = engine.calculateGlassesOverlay(
                          landmarks,
                          landmarks.imageWidth,
                          landmarks.imageHeight,
                          1,
                          1,
                        );
                        setOverlay(overlayConfigRef.current);
                        setHasFace(true);
                      }
                    }
                  };
                  img.src = URL.createObjectURL(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {hasFace && !isProcessing && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Resultado
          </div>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                download();
              }}
              className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
              <Download size={18} />
              Descargar resultado
            </button>
            <button
              onClick={() => {
                setUploadedImage(null);
                setOverlay(null);
                setHasFace(false);
                setError(null);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white">
              <Upload size={16} />
              Reiniciar
            </button>
          </div>
        </>
      )}
    </div>
  );
}