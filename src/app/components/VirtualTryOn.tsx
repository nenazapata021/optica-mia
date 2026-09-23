"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import {
  LoaderCircle,
  Upload,
  Download,
  ImageOff,
  Camera,
  CameraOff,
  ScanFace,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useFaceTryOn } from "../hooks/useFaceTryOn";
import { useWebGLTryOn, createGlassesModelFromProduct } from "../hooks/useWebGLTryOn";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { GlassesOverlayConfig } from "../types/tryOn";
import type { FaceLandmarks } from "../types/tryOn";
import type { Producto } from "../types/producto";

interface VirtualTryOnProps {
  glassesFrontalImageUrl: string;
  faceSrc?: string;
  scaleMultiplier?: number;
  producto?: Producto;
}

type TryOnMode = "live" | "static";

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
 * Draw the full glasses overlay (frontal only) directly on the canvas.
 * Used by the static photo path.
 */
function renderGlassesFrame(
  faceSource: HTMLImageElement | HTMLVideoElement,
  glassesImage: HTMLImageElement,
  overlay: GlassesOverlayConfig,
  canvas: HTMLCanvasElement,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(faceSource, 0, 0, canvas.width, canvas.height);

  const { centerX, centerY, rotation, glassesWidth, glassesHeight, verticalOffset } = overlay;

  // Frontal frame only (no temples)
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
}

export default function VirtualTryOn({
  glassesFrontalImageUrl,
  faceSrc,
  scaleMultiplier,
  producto,
}: VirtualTryOnProps) {
  const [mode, setMode] = useState<TryOnMode>(faceSrc ? "static" : "live");
  const [useWebGL, setUseWebGL] = useState(false);
  const [webglInitError, setWebglInitError] = useState<string | null>(null);
  const [showWebGLFallback, setShowWebGLFallback] = useState(false);

  /* ------------------------- Modo en vivo (webcam) ------------------------ */
  const {
    status: liveStatus,
    error: liveError,
    transform,
    scale,
    isFaceDetected,
    videoRef,
    containerRef,
    start: startLiveCamera,
    stop: stopLiveCamera,
  } = useFaceTryOn(glassesFrontalImageUrl, { scaleMultiplier });

  /* --------------------------- Modo foto estática -------------------------- */
  const { canvasRef, download } = useCanvasRenderer();
  const engine = MediaPipeFaceMeshEngine.getInstance();

  const [faceImage, setFaceImage] = useState<HTMLImageElement | null>(null);
  const [glassesImage, setGlassesImage] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<GlassesOverlayConfig | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [staticError, setStaticError] = useState<string | null>(null);
  const [hasFace, setHasFace] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  /* --------------------------- WebGL Renderer -------------------------- */
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    isWebGLAvailable,
    isLoading: webglLoading,
    error: webglError,
    renderer: webglRenderer,
    initialize: webglInitialize,
    updateFrame: webglUpdateFrame,
    render: webglRender,
    downloadResult: webglDownloadResult,
    dispose: webglDispose,
  } = useWebGLTryOn({
    enableContactShadows: TRY_ON_CONFIG.webgl.enableContactShadows,
    enableChromaticAberration: TRY_ON_CONFIG.webgl.enableChromaticAberration,
    enableSubsurface: TRY_ON_CONFIG.webgl.enableSubsurface,
    enableColorGrading: TRY_ON_CONFIG.webgl.enableColorGrading,
  });

  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const webglInitializedRef = useRef(false);

  // Load only the frontal glasses image (temples disabled for front-only view)
  useEffect(() => {
    let cancelled = false;

    loadImage(glassesFrontalImageUrl).then((img) => {
      if (!cancelled) setGlassesImage(img);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [glassesFrontalImageUrl]);

  // Load face image from src prop
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

  /* --------------------------- WebGL Initialization -------------------------- */
  useEffect(() => {
    if (!isWebGLAvailable || !faceImage || !glassesImage || !producto) return;
    if (webglInitializedRef.current) return;
    if (mode !== "static") return;

    const initWebGL = async () => {
      try {
        setWebglInitError(null);
        
        // Determine frame material and lens type from product
        const frameMaterial = (producto as any).frameMaterial || "acetate";
        const lensType = (producto as any).lensType || 
          (glassesFrontalImageUrl.includes("gafas-de-sol") ? "sunglass" : "clear");
        const productScaleMultiplier = (producto as any).scaleMultiplier ?? scaleMultiplier ?? 1;

        const glassesModel = await createGlassesModelFromProduct(
          producto.id,
          glassesFrontalImageUrl,
          { frameMaterial, lensType, scaleMultiplier: productScaleMultiplier }
        );

        await webglInitialize(faceImage, glassesModel);
        webglInitializedRef.current = true;
        setUseWebGL(true);
        console.log("[VirtualTryOn] WebGL renderer initialized");
      } catch (err) {
        console.warn("[VirtualTryOn] WebGL init failed, falling back to Canvas 2D:", err);
        setWebglInitError(err instanceof Error ? err.message : "WebGL initialization failed");
        setShowWebGLFallback(true);
        setUseWebGL(false);
      }
    };

    initWebGL();

    return () => {
      if (webglInitializedRef.current) {
        webglDispose();
        webglInitializedRef.current = false;
        setUseWebGL(false);
      }
    };
  }, [isWebGLAvailable, faceImage, glassesImage, producto, mode, webglInitialize, webglDispose]);

  // Static image detection + overlay calculation
  useEffect(() => {
    if (mode !== "static") return;
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

        const detectedLandmarks = engine.extractPreciseLandmarks(result);
        if (!detectedLandmarks) {
          setStaticError(TRY_ON_CONFIG.messages.noFace);
          return;
        }

        detectedLandmarks.imageWidth = faceImage.naturalWidth;
        detectedLandmarks.imageHeight = faceImage.naturalHeight;

        const overlayConfig = engine.calculateGlassesOverlay(
          detectedLandmarks,
          faceImage.naturalWidth,
          faceImage.naturalHeight,
          glassesImage.naturalWidth,
          glassesImage.naturalHeight,
          scaleMultiplier ?? 1,
        );

        if (canvasRef.current) {
          canvasRef.current.width = faceImage.naturalWidth;
          canvasRef.current.height = faceImage.naturalHeight;
        }
        
        if (webglCanvasRef.current) {
          webglCanvasRef.current.width = faceImage.naturalWidth;
          webglCanvasRef.current.height = faceImage.naturalHeight;
        }

        setOverlay(overlayConfig);
        setLandmarks(detectedLandmarks);
        setHasFace(true);
        setStaticError(null);
      } catch {
        setIsModelLoading(false);
        setStaticError(TRY_ON_CONFIG.messages.detectionError);
      }
    };

    void detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, faceImage, glassesImage, scaleMultiplier]);

  // Render static frame (Canvas 2D) — frontal only, no temples
  useEffect(() => {
    if (mode !== "static") return;
    if (useWebGL) return; // Skip Canvas 2D if WebGL is active
    if (!faceImage || !glassesImage || !overlay) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderGlassesFrame(faceImage, glassesImage, overlay, canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, faceImage, glassesImage, overlay, useWebGL]);

  // WebGL Render loop (when WebGL is active)
  useEffect(() => {
    if (mode !== "static") return;
    if (!useWebGL || !webglRenderer) return;
    if (!overlay || !landmarks) return;

    // Update WebGL renderer with latest landmarks
    webglUpdateFrame(landmarks, overlay);
    webglRender();
  }, [mode, useWebGL, webglRenderer, overlay, landmarks, webglUpdateFrame, webglRender]);

  // Cleanup recursos del modo estático al desmontar
  useEffect(() => {
    const animFrame = animFrameRef;
    const stream = streamRef;
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
      if (faceImage) URL.revokeObjectURL(faceImage.src);
      if (webglInitializedRef.current) {
        webglDispose();
      }
    };
  }, [faceImage, webglDispose]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detiene la cámara si está activa, cambia a modo foto y abre el
  // explorador de archivos para que el cliente suba una foto nueva.
  const openFileExplorer = () => {
    if (mode === "live") stopLiveCamera();
    setMode("static");
    fileInputRef.current?.click();
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
        setStaticError(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* --------------------------------- UI ---------------------------------- */

const liveBusy = liveStatus === "loading-model" || liveStatus === "starting-camera";

  const handleDownload = async () => {
    if (!faceImage || !overlay || !landmarks) return;
    
    if (useWebGL && webglRenderer) {
      try {
        const blob = await webglDownloadResult(1024, 1024);
        const link = document.createElement("a");
        link.download = "simulacion-optica-mia-1024.jpg";
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("[WebGL] Download failed:", err);
        // Fallback to canvas download
        download(
          faceImage,
          glassesImage!,
          overlay,
          landmarks,
        );
      }
    } else {
      download(
        faceImage,
        glassesImage!,
        overlay,
        landmarks,
      );
    }
  };

  /* --------------------------------- UI ---------------------------------- */

  return (
    <div className="w-full">
      {/* Input compartido para subir foto (abierto por el botón Reiniciar) */}
      <input type="file" accept="image/*" className="hidden" onChange={handleUploadFile} ref={fileInputRef} />

      {mode === "live" ? (
        /* ============================ MODO LIVE ============================ */
        <div
          ref={containerRef}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg"
        >
          {/* El video permanece montado para que el hook pueda adjuntar el stream */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-500 ${
              liveStatus === "running" ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Overlay de la montura (PNG transparente) — solo frente, sin patillas */}
          {transform && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={glassesFrontalImageUrl}
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none select-none transition-opacity duration-300"
              style={{
                transform,
                width: scale !== null ? `${scale}px` : undefined,
                opacity: isFaceDetected && liveStatus === "running" ? 1 : 0,
                maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
              }}
            />
          )}

          {/* Estado: cargando modelo o cámara */}
          {liveBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
                <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                <span className="text-sm font-medium text-slate-700">
                  {liveStatus === "loading-model"
                    ? "Cargando motor de detección..."
                    : "Activando cámara..."}
                </span>
              </div>
            </div>
          )}

          {/* Estado: idle → CTA iniciar */}
          {liveStatus === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 px-6 text-center">
              <ScanFace size={44} className="text-slate-400" />
              <p className="text-sm text-slate-300">
                Pruébate esta montura en tiempo real con tu cámara.
              </p>
              <button
                onClick={() => void startLiveCamera()}
                className="flex items-center gap-2 rounded-xl bg-[#008294] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
              >
                <Camera size={18} />
                Iniciar cámara
              </button>
              <p className="text-xs text-slate-400">
                Tu video no se guarda ni se envía a ningún servidor.
              </p>
            </div>
          )}

          {/* Estado: error (permiso denegado, sin cámara, modelo) */}
          {liveStatus === "error" && liveError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/85 px-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
                <CameraOff size={32} className="text-red-500" />
                <p className="max-w-xs text-sm text-slate-700">{liveError}</p>
                <button
                  onClick={() => void startLiveCamera()}
                  className="mt-1 flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
                >
                  <RefreshCcw size={16} />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Estado: corriendo */}
          {liveStatus === "running" && (
            <>
              {!isFaceDetected && (
                <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center px-4">
                  <p className="rounded-full bg-black/55 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    No detectamos tu rostro. Ubícate de frente y con buena iluminación.
                  </p>
                </div>
              )}
              <button
                onClick={stopLiveCamera}
                className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow transition hover:bg-white"
              >
                <CameraOff size={14} />
                Detener
              </button>
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 backdrop-blur-sm">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isFaceDetected ? "animate-pulse bg-green-400" : "bg-slate-400"}`}
                />
                <span className="text-[10px] font-medium uppercase tracking-wide text-white">
                  {isFaceDetected ? "Rostro detectado" : "Buscando rostro"}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ========================== MODO ESTÁTICO ========================== */
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
          {/* Canvas 2D (fallback) */}
          <canvas
            ref={canvasRef}
            className={`block h-full w-full object-contain ${useWebGL ? "hidden" : ""}`}
          />
          
          {/* WebGL Canvas (primary when available) */}
          <canvas
            ref={webglCanvasRef}
            className={`block h-full w-full object-contain ${!useWebGL ? "hidden" : ""}`}
          />

          {/* WebGL Loading indicator */}
          {webglLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
                <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                <span className="text-sm font-medium text-slate-700">
                  Inicializando renderizador fotorealista...
                </span>
              </div>
            </div>
          )}

          {/* WebGL Error fallback notice */}
          {showWebGLFallback && !webglLoading && (
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-amber-100/95 px-3 py-2 text-xs font-medium text-amber-800 backdrop-blur-sm border border-amber-300">
              <AlertTriangle size={14} />
              <span>Usando renderizado clásico (Canvas 2D)</span>
            </div>
          )}

          {/* WebGL Active indicator */}
          {useWebGL && !webglLoading && !showWebGLFallback && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 backdrop-blur-sm">
              <CheckCircle size={12} className="text-white" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-white">
                Render fotorealista activo
              </span>
            </div>
          )}

          {isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
                <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                <span className="text-sm font-medium text-slate-700">Cargando IA...</span>
              </div>
            </div>
          )}

          {!faceSrc && !faceImage && !isModelLoading && !webglLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
              <ImageOff size={40} className="text-slate-400" />
              <p className="max-w-xs text-center text-sm text-slate-300">
                Sube una foto frontal para probar la montura.
              </p>
              <button
                onClick={openFileExplorer}
                className="mb-4 flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
              >
                <Upload size={18} />
                Subir foto
              </button>
              <p className="mt-3 text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
            </div>
          )}

          {faceSrc && !faceImage && !staticError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
                <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                <span className="text-sm font-medium text-slate-700">Preparando simulación...</span>
              </div>
            </div>
          )}

          {faceImage && overlay && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Resultado
            </div>
          )}

          {hasFace && faceImage && overlay && landmarks && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#005f6b]"
              >
                <Download size={18} />
                Descargar resultado (1024×1024)
              </button>
            </div>
          )}

          {staticError && faceImage && !hasFace && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
                <ImageOff size={32} className="text-red-500" />
                <p className="max-w-xs text-sm text-slate-700">{staticError}</p>
                <p className="text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón único: abre el explorador de archivos para subir una foto nueva */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={openFileExplorer}
          disabled={liveBusy || webglLoading}
          className="flex items-center gap-2 rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={16} />
          Reiniciar
        </button>
      </div>
    </div>
  );
}
