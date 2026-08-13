"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { LoaderCircle, Upload, Download, ImageOff, Camera } from "lucide-react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { OverlayConfig } from "../types/tryOn";
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

function drawThreePieceGlasses(
  faceImage: HTMLImageElement,
  glassesImage: HTMLImageElement,
  leftTempleImage: HTMLImageElement,
  rightTempleImage: HTMLImageElement,
  overlay: OverlayConfig & { leftTempleOpacity: number; rightTempleOpacity: number },
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): void {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = faceImage.naturalWidth;
  canvas.height = faceImage.naturalHeight;

  ctx.drawImage(faceImage, 0, 0, canvas.width, canvas.height);

  const { centerX, centerY, scale, rotation, glassesWidth, glassesHeight, verticalOffset } = overlay;
  const { leftTempleOpacity, rightTempleOpacity } = overlay;

  // Dibujar frontal de la gafa (centrado sobre el puente)
  ctx.save();
  ctx.translate(centerX, centerY + (overlay.verticalOffset || 0));
  ctx.rotate(rotation);

  const isFrontalOverlay = glassesImage.src.includes("sin-fondo") || glassesImage.src.endsWith(".png");
  ctx.globalCompositeOperation = isFrontalOverlay ? "source-over" : "multiply";

  ctx.drawImage(
    glassesImage,
    -glassesWidth / 2,
    -glassesHeight / 2,
    glassesWidth,
    glassesHeight,
  );
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // Dibujar pata izquierda
  ctx.save();
  ctx.globalAlpha = leftTempleOpacity;

  const templeLeftX = centerX - glassesWidth / 2 - 20;
  const templeLeftY = centerY + (verticalOffset || 0) + 30;

  ctx.translate(templeLeftX, templeLeftY);
  ctx.rotate(rotation);

  const templeScale = glassesWidth / 60;
  ctx.drawImage(
    leftTempleImage,
    -20 * templeScale,
    -120 * templeScale,
    40 * templeScale,
    240 * templeScale,
  );
  ctx.globalAlpha = 1;
  ctx.restore();

  // Dibujar pata derecha
  ctx.save();
  ctx.globalAlpha = rightTempleOpacity;

  const templeRightX = centerX + glassesWidth / 2 + 20;
  const templeRightY = centerY + (verticalOffset || 0) + 30;

  ctx.translate(templeRightX, templeRightY);
  ctx.rotate(rotation);

  ctx.drawImage(
    rightTempleImage,
    -20 * templeScale,
    -120 * templeScale,
    40 * templeScale,
    240 * templeScale,
  );
  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function VirtualTryOn({
  glassesFrontalImageUrl,
  glassesTempleLeftImageUrl,
  glassesTempleRightImageUrl,
  faceSrc,
  scaleMultiplier,
}: VirtualTryOnProps) {
  const { canvasRef, drawImageFrame, download } = useCanvasRenderer();

  const [faceImage, setFaceImage] = useState<HTMLImageElement | null>(null);
  const [glassesImage, setGlassesImage] = useState<HTMLImageElement | null>(null);
  const [leftTempleImage, setLeftTempleImage] = useState<HTMLImageElement | null>(null);
  const [rightTempleImage, setRightTempleImage] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<OverlayConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const engine = MediaPipeFaceMeshEngine.getInstance();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadImage(glassesFrontalImageUrl),
      loadImage(glassesTempleLeftImageUrl),
      loadImage(glassesTempleRightImageUrl),
    ]).then(([frontal, leftTemple, rightTemple]) => {
      if (!cancelled) {
        setGlassesImage(frontal);
        setLeftTempleImage(leftTemple);
        setRightTempleImage(rightTemple);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [glassesFrontalImageUrl, glassesTempleLeftImageUrl, glassesTempleRightImageUrl]);

  useEffect(() => {
    if (!faceSrc || faceSrc === "") return;
    let cancelled = false;
    loadImage(faceSrc).then((img) => {
      if (!cancelled) setFaceImage(img);
    });
    return () => {
      cancelled = true;
    };
  }, [faceSrc]);

  useEffect(() => {
    if (!faceImage || !glassesImage) return;
    if (hasFace) return;

    const detect = async () => {
      try {
        const loaded = engine.isLoaded();
        if (!loaded) {
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

        // Calcular yaw usando distancias ojo-nariz
        const faceLm = result.faceLandmarks[0];
        const noseTip = { x: faceLm[1].x, y: faceLm[1].y };
        const leftEyeOuter = { x: faceLm[133].x, y: faceLm[133].y };
        const rightEyeOuter = { x: faceLm[361].x, y: faceLm[361].y };

        const leftDist = Math.hypot(noseTip.x - leftEyeOuter.x, noseTip.y - leftEyeOuter.y);
        const rightDist = Math.hypot(noseTip.x - rightEyeOuter.x, noseTip.y - rightEyeOuter.y);
        const yawRatio = leftDist / rightDist; // >1 indica giro a la izquierda, <1 a la derecha

        // Factor de reducción de opacidad
        const opacityFactor = 0.8;
        const templeOpacity = Math.max(0.2, 1 - Math.abs(1 - yawRatio) * opacityFactor);

        // Determinar opacidad según el yaw
        const leftTempleOpacityValue = yawRatio > 1 ? templeOpacity : 1;
        const rightTempleOpacityValue = yawRatio < 1 ? templeOpacity : 1;

        const overlayConfig = engine.calculateGlassesOverlay(
          landmarks,
          faceImage.naturalWidth,
          faceImage.naturalHeight,
          glassesImage.naturalWidth,
          glassesImage.naturalHeight,
          scaleMultiplier ?? 1,
        );

        setOverlay({
          ...overlayConfig,
          leftTempleOpacity: leftTempleOpacityValue,
          rightTempleOpacity: rightTempleOpacityValue,
        });
        setHasFace(true);
        setError(null);
      } catch {
        setError(TRY_ON_CONFIG.messages.detectionError);
      }
    };

    void detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceImage, glassesImage, scaleMultiplier, engine]);

  useEffect(() => {
    if (!faceImage || !glassesImage || !leftTempleImage || !rightTempleImage) return;
    if (!overlay) return;
    drawThreePieceGlasses(
      faceImage,
      glassesImage,
      leftTempleImage!,
      rightTempleImage!,
      overlay,
      canvasRef,
    );
  }, [faceImage, glassesImage, leftTempleImage, rightTempleImage, overlay, canvasRef]);

  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !glassesImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!engine.isLoaded()) {
      engine.load("IMAGE").catch(() => {});
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
          ctx.drawImage(video, 0, 0);

          ctx.save();
          ctx.translate(overlayConfig.centerX, overlayConfig.centerY);
          ctx.rotate(overlayConfig.rotation);

          const isOverlay = glassesImage.src.includes("sin-fondo") || glassesImage.src.endsWith(".png");
          ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";

          // Dibujar frontal
          ctx.drawImage(
            glassesImage,
            -overlayConfig.glassesWidth / 2,
            -overlayConfig.glassesHeight / 2,
            overlayConfig.glassesWidth,
            overlayConfig.glassesHeight,
          );

          // Dibujar pata izquierda con opacidad
          ctx.save();
          ctx.globalAlpha = overlayConfig.leftTempleOpacity;

          const templeLeftX = overlayConfig.centerX - overlayConfig.glassesWidth / 2 - 20;
          const templeLeftY = overlayConfig.centerY + 30;

          ctx.translate(templeLeftX, templeLeftY);
          ctx.rotate(overlayConfig.rotation);

          const templeScale = overlayConfig.glassesWidth / 60;
          ctx.drawImage(
            leftTempleImage!,
            -20 * templeScale,
            -120 * templeScale,
            40 * templeScale,
            240 * templeScale,
          );
          ctx.globalAlpha = 1;
          ctx.restore();

          // Dibujar pata derecha con opacidad
          ctx.save();
          ctx.globalAlpha = overlayConfig.rightTempleOpacity;

          const templeRightX = overlayConfig.centerX + overlayConfig.glassesWidth / 2 + 20;
          const templeRightY = overlayConfig.centerY + 30;

          ctx.translate(templeRightX, templeRightY);
          ctx.rotate(overlayConfig.rotation);

          ctx.drawImage(
            rightTempleImage!,
            -20 * templeScale,
            -120 * templeScale,
            40 * templeScale,
            240 * templeScale,
          );
          ctx.globalAlpha = 1;
          ctx.restore();

          ctx.globalCompositeOperation = "source-over";
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(detectVideoFrame);
    };

    animFrameRef.current = requestAnimationFrame(detectVideoFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive, glassesImage, canvasRef, scaleMultiplier]);

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