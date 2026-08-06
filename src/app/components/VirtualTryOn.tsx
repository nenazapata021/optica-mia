"use client";

import { useEffect, useRef, useCallback, useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle, Upload, VideoOff, RefreshCw } from "lucide-react";
import { useFaceLandmarks } from "../hooks/useFaceLandmarks";
import { useStaticFaceDetection } from "../hooks/useStaticFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";

interface VirtualTryOnProps {
  glassesUrl: string;
  onCapture?: (dataUrl: string) => void;
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

export default function VirtualTryOn({ glassesUrl, onCapture }: VirtualTryOnProps) {
  const {
    videoRef,
    overlayConfig: cameraOverlay,
    isDetecting,
    isLoading: cameraLoading,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
  } = useFaceLandmarks();

  const {
    detectFromImage,
    isLoading: staticLoading,
    error: staticError,
  } = useStaticFaceDetection();

  const { canvasRef, drawVideoFrame, drawImageFrame, clear } = useCanvasRenderer();
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [staticOverlay, setStaticOverlay] = useState<ReturnType<typeof useStaticFaceDetection> extends { detectFromImage: (...args: any[]) => Promise<infer R> } ? R : never>(null);
  const [isRendering, setIsRendering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(glassesUrl).then((img) => {
      if (!cancelled) glassesImgRef.current = img;
    });
    return () => { cancelled = true; };
  }, [glassesUrl]);

  // Try camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // If camera fails, switch to upload mode
  useEffect(() => {
    if (cameraError) setMode("upload");
  }, [cameraError]);

  // Camera render loop
  const renderLoop = useCallback(() => {
    if (mode !== "camera") return;

    const video = videoRef.current;
    const glasses = glassesImgRef.current;
    const overlay = cameraOverlay;

    if (video && glasses && overlay && video.readyState >= 2) {
      drawVideoFrame(video, glasses, overlay);
      setIsRendering(true);
    } else if (video && video.readyState >= 2) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(video, 0, 0);
      }
      setIsRendering(false);
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [mode, cameraOverlay, drawVideoFrame, videoRef, canvasRef]);

  useEffect(() => {
    if (mode === "camera") {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mode, renderLoop]);

  // Upload mode: draw static image + overlay
  useEffect(() => {
    if (mode === "upload" && uploadedImage && staticOverlay && glassesImgRef.current) {
      drawImageFrame(uploadedImage, glassesImgRef.current, staticOverlay);
      setIsRendering(true);
    }
  }, [mode, uploadedImage, staticOverlay, drawImageFrame]);

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const img = new Image();
    img.onload = async () => {
      setUploadedImage(img);
      setIsRendering(false);
      const overlay = await detectFromImage(img);
      if (overlay) {
        setStaticOverlay(overlay);
      } else {
        setStaticOverlay(null);
      }
    };
    img.src = URL.createObjectURL(file);
  }, [detectFromImage]);

  const handleRetryCamera = useCallback(() => {
    setMode("camera");
    setUploadedImage(null);
    setStaticOverlay(null);
    startCamera();
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCapture) return;
    onCapture(canvas.toDataURL("image/jpeg", 0.92));
  }, [canvasRef, onCapture]);

  const handleStop = useCallback(() => {
    stopCamera();
    clear();
  }, [stopCamera, clear]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
      {mode === "camera" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover opacity-0"
        />
      )}
      <canvas ref={canvasRef} className="block h-auto w-full" />

      {cameraLoading && mode === "camera" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={18} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Cargando c&aacute;mara...</span>
          </div>
        </div>
      )}

      {mode === "upload" && !uploadedImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <VideoOff size={40} className="text-slate-400" />
          <p className="max-w-xs text-center text-sm text-slate-300">
            No hay c&aacute;mara disponible. Sube una foto frontal para probar la montura.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
            <Upload size={18} />
            Subir foto
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {mode === "upload" && uploadedImage && staticLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={18} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Analizando rostro...</span>
          </div>
        </div>
      )}

      {mode === "upload" && uploadedImage && staticError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
            <VideoOff size={32} className="text-red-500" />
            <p className="max-w-xs text-sm text-slate-700">{staticError}</p>
            <p className="text-xs text-slate-400">Usa una foto frontal con buena iluminaci&oacute;n.</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
            <Upload size={18} />
            Subir otra foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {!cameraLoading && !isDetecting && mode === "camera" && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={16} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Buscando rostro...</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
        {mode === "upload" && uploadedImage && (
          <>
            <button
              onClick={handleCapture}
              disabled={!isRendering}
              className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b] disabled:opacity-50"
            >
              <Camera size={18} />
              Capturar foto
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white">
              <Upload size={16} />
              Otra foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </>
        )}
        {mode === "upload" && !uploadedImage && cameraError && (
          <button
            onClick={handleRetryCamera}
            className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white"
          >
            <RefreshCw size={16} />
            Intentar con c&aacute;mara
          </button>
        )}
        {mode === "camera" && (
          <button
            onClick={handleStop}
            className="rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white"
          >
            Detener
          </button>
        )}
      </div>
    </div>
  );
}
