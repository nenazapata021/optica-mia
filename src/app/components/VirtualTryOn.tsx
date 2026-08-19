"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { LoaderCircle, Upload, Download, ImageOff, Camera } from "lucide-react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { GlassesOverlayConfig } from "../types/tryOn";
import type { Producto } from "../types/producto";

interface VirtualTryOnProps {
  glassesFrontalImageUrl: string;
  glassesTempleLeftImageUrl: string;
  glassesTempleRightImageUrl: string;
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

/**
 * Draw the full glasses overlay (temples + frontal) directly on the canvas.
 * Used by both static and video paths.
 */
function renderGlassesFrame(
  faceSource: HTMLImageElement | HTMLVideoElement,
  glassesImage: HTMLImageElement,
  overlay: GlassesOverlayConfig,
  leftTempleImg: HTMLImageElement | null,
  rightTempleImg: HTMLImageElement | null,
  canvas: HTMLCanvasElement,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(faceSource, 0, 0, canvas.width, canvas.height);

  const { centerX, centerY, rotation, glassesWidth, glassesHeight, verticalOffset } = overlay;

  // Determine occlusion order based on yaw
  const leftIsInFront = overlay.headPose.yaw >= 0;

  const behind = leftIsInFront
    ? { img: rightTempleImg, t: overlay.rightTemple }
    : { img: leftTempleImg, t: overlay.leftTemple };
  const front = leftIsInFront
    ? { img: leftTempleImg, t: overlay.leftTemple }
    : { img: rightTempleImg, t: overlay.rightTemple };

  // 1) Temple behind the face
  if (behind.img && behind.t) {
    drawTempleArm(ctx, behind.img, behind.t);
  }

  // 2) Frontal frame
  ctx.save();
  ctx.translate(centerX, centerY + (verticalOffset || 0));
  ctx.rotate(rotation);
  const isOverlay = glassesImage.src.includes("sin-fondo") || glassesImage.src.endsWith(".png");
  ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";
  ctx.drawImage(
    glassesImage,
    -glassesWidth / 2,
    -glassesHeight / 2,
    glassesWidth,
    glassesHeight,
  );
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // 3) Temple in front of the face
  if (front.img && front.t) {
    drawTempleArm(ctx, front.img, front.t);
  }
}

function drawTempleArm(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: GlassesOverlayConfig["leftTemple"],
): void {
  if (t.opacity < 0.01 || t.length < 1) return;

  ctx.save();
  ctx.globalAlpha = t.opacity;
  ctx.translate(t.anchorX, t.anchorY);
  ctx.rotate(t.rotation);
  ctx.transform(t.scaleX, t.skewY, t.skewX, 1, 0, 0);

  ctx.drawImage(img, -t.width / 2, -t.length, t.width, t.length);
  ctx.restore();
}

export default function VirtualTryOn({
  glassesFrontalImageUrl,
  glassesTempleLeftImageUrl,
  glassesTempleRightImageUrl,
  faceSrc,
  scaleMultiplier,
}: VirtualTryOnProps) {
  const { canvasRef, download } = useCanvasRenderer();

  const [faceImage, setFaceImage] = useState<HTMLImageElement | null>(null);
  const [glassesImage, setGlassesImage] = useState<HTMLImageElement | null>(null);
  const [leftTempleImage, setLeftTempleImage] = useState<HTMLImageElement | null>(null);
  const [rightTempleImage, setRightTempleImage] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<GlassesOverlayConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const engine = MediaPipeFaceMeshEngine.getInstance();

  // Load all three glasses images (frontal + temples)
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const [frontal, leftTemple, rightTemple] = await Promise.allSettled([
        loadImage(glassesFrontalImageUrl),
        glassesTempleLeftImageUrl ? loadImage(glassesTempleLeftImageUrl) : Promise.resolve(null),
        glassesTempleRightImageUrl ? loadImage(glassesTempleRightImageUrl) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      setGlassesImage(frontal.status === "fulfilled" ? frontal.value : null);
      setLeftTempleImage(leftTemple.status === "fulfilled" ? leftTemple.value : null);
      setRightTempleImage(rightTemple.status === "fulfilled" ? rightTemple.value : null);
    };

    void loadAll();
    return () => { cancelled = true; };
  }, [glassesFrontalImageUrl, glassesTempleLeftImageUrl, glassesTempleRightImageUrl]);

  // Load face image from src prop
  useEffect(() => {
    if (!faceSrc || faceSrc === "") return;
    let cancelled = false;
    loadImage(faceSrc).then((img) => {
      if (!cancelled) setFaceImage(img);
    });
    return () => { cancelled = true; };
  }, [faceSrc]);

  // Static image detection + overlay calculation
  useEffect(() => {
    if (!faceImage || !glassesImage) return;
    if (hasFace) return;

    const detect = async () => {
      try {
        if (!engine.isLoaded()) {
          setIsModelLoading(true);
          await engine.load("IMAGE");
          setIsModelLoading(false);
        }

        const result = engine.detectImage(faceImage);
        if (!result) return;

        const landmarks = engine.extractPreciseLandmarks(result);
        if (!landmarks) {
          setError(TRY_ON_CONFIG.messages.noFace);
          return;
        }

        landmarks.imageWidth = faceImage.naturalWidth;
        landmarks.imageHeight = faceImage.naturalHeight;

        const overlayConfig = engine.calculateGlassesOverlay(
          landmarks,
          faceImage.naturalWidth,
          faceImage.naturalHeight,
          glassesImage.naturalWidth,
          glassesImage.naturalHeight,
          scaleMultiplier ?? 1,
        );

        canvasRef.current!.width = faceImage.naturalWidth;
        canvasRef.current!.height = faceImage.naturalHeight;

        setOverlay(overlayConfig);
        setHasFace(true);
        setError(null);
      } catch {
        setError(TRY_ON_CONFIG.messages.detectionError);
      }
    };

    void detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceImage, glassesImage, scaleMultiplier, engine]);

  // Render static frame with temples
  useEffect(() => {
    if (!faceImage || !glassesImage || !overlay) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderGlassesFrame(faceImage, glassesImage, overlay, leftTempleImage, rightTempleImage, canvas);
  }, [faceImage, glassesImage, overlay, leftTempleImage, rightTempleImage, canvasRef]);

  // Video mode: detect + render each frame with temples
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !glassesImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!engine.isLoaded()) {
      engine.load("VIDEO").catch(() => {});
      return;
    }

    const detectVideoFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detectVideoFrame);
        return;
      }

      const ts = Date.now();
      const result = engine.detectVideo(video, ts);
      if (result) {
        const landmarks = engine.extractPreciseLandmarks(result);
        if (landmarks) {
          landmarks.imageWidth = video.videoWidth;
          landmarks.imageHeight = video.videoHeight;

          const overlayConfig = engine.calculateGlassesOverlay(
            landmarks,
            video.videoWidth,
            video.videoHeight,
            glassesImage.naturalWidth,
            glassesImage.naturalHeight,
            scaleMultiplier ?? 1,
          );

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          renderGlassesFrame(
            video,
            glassesImage,
            overlayConfig,
            leftTempleImage,
            rightTempleImage,
            canvas,
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(detectVideoFrame);
    };

    animFrameRef.current = requestAnimationFrame(detectVideoFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive, glassesImage, canvasRef, scaleMultiplier, leftTempleImage, rightTempleImage]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (faceImage) URL.revokeObjectURL(faceImage.src);
    };
  }, [faceImage]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      streamRef.current = s;
      setIsCameraActive(true);
      setError(null);
    } catch {
      setError("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    setIsCameraActive(false);
    setHasFace(false);
    setOverlay(null);
    setError(null);
  };

  const handleUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setFaceImage(img);
        setOverlay(null);
        setHasFace(false);
        setError(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
      <canvas ref={canvasRef} className="block h-full w-full object-contain" />

      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={20} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Cargando IA...</span>
          </div>
        </div>
      )}

      {!faceSrc && !faceImage && !isCameraActive && !isModelLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <ImageOff size={40} className="text-slate-400" />
          <p className="max-w-xs text-center text-sm text-slate-300">
            Sube una foto frontal para probar la montura.
          </p>
          <div className="mb-4 flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
              <Upload size={18} />
              Subir foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadFile}
              />
            </label>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
            >
              <Camera size={18} />
              Usar cámara
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
        </div>
      )}

      {faceSrc && !faceImage && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
            <LoaderCircle size={20} className="animate-spin text-[#008294]" />
            <span className="text-sm font-medium text-slate-700">Preparando simulación...</span>
          </div>
        </div>
      )}

      {isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
          <div className="relative h-56 w-full max-w-xs rounded-xl border border-slate-300 bg-black overflow-hidden">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition:hover:bg-white"
          >
            Cancelar
          </button>
        </div>
      )}

      {faceImage && overlay && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Resultado
        </div>
      )}

      {hasFace && faceImage && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-3">
          <button
            onClick={() => download()}
            className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition:hover:bg-[#005f6b]">
            <Download size={18} />
            Descargar resultado
          </button>
          <button
            onClick={() => {
              setFaceImage(null);
              setOverlay(null);
              setHasFace(false);
              setError(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition:hover:bg-white">
            <Upload size={16} />
            Reiniciar
          </button>
        </div>
      )}

      {error && !hasFace && faceImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
            <ImageOff size={32} className="text-red-500" />
            <p className="max-w-xs text-sm text-slate-700">{error}</p>
            <p className="text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
          </div>
        </div>
      )}
    </div>
  );
}
