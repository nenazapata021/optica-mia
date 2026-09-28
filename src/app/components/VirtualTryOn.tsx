"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, ScanFace, RefreshCcw, Upload } from "lucide-react";
import { TRY_ON_CONFIG } from "../config/tryOn";

/* ─── Tipos locales ──────────────────────────────────────── */
type TryOnStatus = "idle" | "loading-model" | "starting-camera" | "running" | "error";
interface SmoothedPose {
  x: number; y: number; widthPx: number;
  rollDeg: number; yawDeg: number; pitchDeg: number;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, alpha: number) => a + (b - a) * alpha;

function scheduleNextFrame(
  video: HTMLVideoElement | null,
  tick: () => void,
  rafId: { current: number | null },
) {
  if (video && "requestVideoFrameCallback" in video) {
    video.requestVideoFrameCallback(() => tick());
  } else {
    rafId.current = requestAnimationFrame(tick);
  }
}

function computeCoverMapping(videoW: number, videoH: number, containerW: number, containerH: number) {
  const coverScale = Math.max(containerW / videoW, containerH / videoH);
  return {
    offsetX: (containerW - videoW * coverScale) / 2,
    offsetY: (containerH - videoH * coverScale) / 2,
    displayedW: videoW * coverScale,
    displayedH: videoH * coverScale,
  };
}

/* ─── Singleton del modelo MediaPipe ───────────────────────── */
let landmarkerCache: { landmarker: unknown; delegate: "GPU" | "CPU" } | null = null;

async function loadFaceLandmarker(): Promise<{ landmarker: unknown; delegate: "GPU" | "CPU" }> {
  if (landmarkerCache) return landmarkerCache;
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(TRY_ON_CONFIG.faceLandmarker.basePath);
  const base = { modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl };
  const common = {
    runningMode: "VIDEO" as const,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
  };
  try {
    const lm = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { ...base, delegate: "GPU" as const },
      ...common,
    });
    const result = { landmarker: lm, delegate: "GPU" as const };
    landmarkerCache = result;
    return result;
  } catch {
    const lm = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { ...base, delegate: "CPU" as const },
      ...common,
    });
    const result = { landmarker: lm, delegate: "CPU" as const };
    landmarkerCache = result;
    return result;
  }
}

/* ─── Props ───────────────────────────────────────────────── */
interface VirtualTryOnProps {
  glassesFrontalImageUrl: string;
  faceSrc?: string;
  scaleMultiplier?: number;
}

/* ─── Componente ──────────────────────────────────────────── */
export default function VirtualTryOn({ glassesFrontalImageUrl, faceSrc, scaleMultiplier = 1 }: VirtualTryOnProps) {
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [transform, setTransform] = useState<string | null>(null);
  const [scale, setScale] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const frameCountRef = useRef(0);
  const delegateRef = useRef<"GPU" | "CPU">("GPU");
  const lastSeenAtRef = useRef(0);
  const smoothedRef = useRef<SmoothedPose | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  const hasFaceRef = useRef(false);

  const hasFaceSrc = !!faceSrc && faceSrc !== "";

  /* ── Precarga de imágenes ────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (!cancelled) glassesImgRef.current = img; };
    img.src = glassesFrontalImageUrl;
    return () => { cancelled = true; };
  }, [glassesFrontalImageUrl]);

  useEffect(() => {
    if (!hasFaceSrc) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (!cancelled) { faceImageRef.current = img; detectStaticFace(); } };
    img.src = faceSrc;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceSrc]);

  /* ── Detectar cara en foto estática ──────────────────── */
  const detectStaticFace = useCallback(async () => {
    const faceImg = faceImageRef.current;
    const glassesImg = glassesImgRef.current;
    if (!faceImg || !glassesImg) return;

    setStatus("loading-model");
    try {
      const { landmarker } = await loadFaceLandmarker();
      landmarkerRef.current = landmarker;

      const result = (landmarker as any).detect(faceImg);
      const landmarks = result.faceLandmarks?.[0];
      if (!landmarks || landmarks.length < 478) {
        setStatus("idle");
        setError(TRY_ON_CONFIG.messages.noFace);
        return;
      }

      // Compute overlay from landmarks
      const cfg = TRY_ON_CONFIG.faceMeshEngine;
      const iw = faceImg.naturalWidth;
      const ih = faceImg.naturalHeight;

      // Inner eye corners (133, 362)
      const innerLeftPx = { x: landmarks[133].x * iw, y: landmarks[133].y * ih };
      const innerRightPx = { x: landmarks[362].x * iw, y: landmarks[362].y * ih };
      let anchorX = (innerLeftPx.x + innerRightPx.x) / 2;
      const anchorY = (innerLeftPx.y + innerRightPx.y) / 2;

      // Roll from cheeks
      const cheekL = landmarks[TRY_ON_CONFIG.liveEngine.cheekLeftIndex];
      const cheekR = landmarks[TRY_ON_CONFIG.liveEngine.cheekRightIndex];
      let rollDeg = (Math.atan2(cheekR.y - cheekL.y, cheekR.x - cheekL.x) * 180) / Math.PI;

      // Temple-to-temple scale
      const earLeft = landmarks[234];
      const earRight = landmarks[454];
      const templeDist = Math.hypot(
        (earRight.x - earLeft.x) * iw,
        (earRight.y - earLeft.y) * ih
      );
      const templeMargin = TRY_ON_CONFIG.temple?.templeMarginFactor ?? 1.1;
      const targetWidthPx = templeDist * templeMargin * scaleMultiplier;

      // Mirror correction for selfie-style
      anchorX = iw - anchorX;
      rollDeg = -rollDeg;

      smoothedRef.current = { x: anchorX, y: anchorY, widthPx: targetWidthPx, rollDeg, yawDeg: 0, pitchDeg: 0 };

      setTransform(
        `translate(${anchorX.toFixed(2)}px, ${anchorY.toFixed(2)}px) translate(-50%, -50%) ` +
        `rotate(${rollDeg.toFixed(2)}deg) perspective(${TRY_ON_CONFIG.perspectivePx}px) rotateY(0deg) rotateX(0deg)`,
      );
      setScale(Math.round(targetWidthPx));
      setIsFaceDetected(true);
      hasFaceRef.current = true;
      setStatus("idle");
    } catch {
      setStatus("idle");
      setError(TRY_ON_CONFIG.messages.detectionError);
    }
  }, [scaleMultiplier]);

  /* ── Mantener tickRef actualizado ──────────────────────── */
  useEffect(() => {
    tickRef.current = tick;
  });

  /* ── Cleanup al desmontar ────────────────────────────── */
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Bucle de detección en vivo ───────────────────────── */
  const tick = useCallback(async () => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    if (video.readyState < 2) {
      scheduleNextFrame(video, tickRef.current!, rafRef);
      return;
    }

    frameCountRef.current += 1;
    if (delegateRef.current === "CPU" && frameCountRef.current % TRY_ON_CONFIG.cpuThrottleDivisor !== 0) {
      scheduleNextFrame(video, tickRef.current!, rafRef);
      return;
    }

    try {
      const { landmarker } = await loadFaceLandmarker();
      if (!runningRef.current) return;
      landmarkerRef.current = landmarker;

      const result = (landmarker as any).detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];
      const now = performance.now();

      if (!landmarks || landmarks.length < 478) {
        if (lastSeenAtRef.current > 0 && now - lastSeenAtRef.current > TRY_ON_CONFIG.faceLostGraceMs) {
          setIsFaceDetected(false);
        }
        scheduleNextFrame(video, tickRef.current!, rafRef);
        return;
      }

      lastSeenAtRef.current = now;
      setIsFaceDetected(true);

      const cfg = TRY_ON_CONFIG.liveEngine;
      const smoothing = TRY_ON_CONFIG.smoothing;
      const clamps = TRY_ON_CONFIG.clamps;

      const rect = container.getBoundingClientRect();
      const cw = rect.width, ch = rect.height;
      if (cw === 0 || ch === 0) { scheduleNextFrame(video, tickRef.current!, rafRef); return; }
      const map = computeCoverMapping(video.videoWidth, video.videoHeight, cw, ch);
      const toPxX = (nx: number) => nx * map.displayedW + map.offsetX;
      const toPxY = (ny: number) => ny * map.displayedH + map.offsetY;

      // Iris centroids
      let lIx = 0, lIy = 0;
      for (let i = 468; i <= 472; i++) { lIx += landmarks[i].x; lIy += landmarks[i].y; }
      lIx /= 5; lIy /= 5;
      let rIx = 0, rIy = 0;
      for (let i = 473; i <= 477; i++) { rIx += landmarks[i].x; rIy += landmarks[i].y; }
      rIx /= 5; rIy /= 5;

      // Inner eye corners → bridge center
      const innerLeftPx = { x: toPxX(landmarks[133].x), y: toPxY(landmarks[133].y) };
      const innerRightPx = { x: toPxX(landmarks[362].x), y: toPxY(landmarks[362].y) };
      let anchorX = (innerLeftPx.x + innerRightPx.x) / 2;
      const anchorY = (toPxY(landmarks[133].y) + toPxY(landmarks[362].y)) / 2;

      // Roll from cheeks
      const cheekL = landmarks[cfg.cheekLeftIndex];
      const cheekR = landmarks[cfg.cheekRightIndex];
      let rollDeg = (Math.atan2(toPxY(cheekR.y) - toPxY(cheekL.y), toPxX(cheekR.x) - toPxX(cheekL.x)) * 180) / Math.PI;

      // Yaw/Pitch from nose
      const noseTip = landmarks[cfg.noseTipIndex];
      const noseBase = landmarks[cfg.noseBaseIndex];
      const noseBridgeLower = landmarks[cfg.noseBridgeLowerIndex];
      const noseMidX = (noseBase.x + noseBridgeLower.x) / 2;
      const noseMidY = (noseBase.y + noseBridgeLower.y) / 2;
      const noseMidZ = (noseBase.z + noseBridgeLower.z) / 2;
      const ipdNorm = Math.hypot(rIx - lIx, rIy - lIy) || 1e-6;
      const dxNorm = (noseTip.x - noseMidX) / ipdNorm;
      const dyNorm = (noseTip.y - noseMidY) / ipdNorm;
      const yawFromZ = Math.atan2(noseMidZ - noseTip.z, 0.35);
      const yawFromX = Math.asin(clamp(dxNorm * 1.4, -1, 1));
      const pitchFromZ = Math.atan2(noseTip.z - noseMidZ, 0.3);
      const pitchFromY = Math.asin(clamp(dyNorm * 1.8, -1, 1));
      let yawDeg = clamp((yawFromZ * 0.55 + yawFromX * 0.45) * (180 / Math.PI), -clamps.maxYawDeg, clamps.maxYawDeg);
      const pitchDeg = clamp((pitchFromZ * 0.5 + pitchFromY * 0.5) * (180 / Math.PI), -clamps.maxPitchDeg, clamps.maxPitchDeg);

      // Mirror selfie correction
      if (TRY_ON_CONFIG.liveEngine.mirrorPreview) {
        anchorX = cw - anchorX;
        rollDeg = -rollDeg;
        yawDeg = -yawDeg;
      }

      // Scale
      const multiplier = scaleMultiplier;
      const templeMargin = TRY_ON_CONFIG.temple?.templeMarginFactor ?? 1.1;
      const earLeft = landmarks[234];
      const earRight = landmarks[454];
      const earLeftPx = { x: toPxX(earLeft.x), y: toPxY(earLeft.y) };
      const earRightPx = { x: toPxX(earRight.x), y: toPxY(earRight.y) };
      const templeDist = Math.hypot(earRightPx.x - earLeftPx.x, earRightPx.y - earLeftPx.y);
      const targetWidthPx = templeDist * templeMargin * multiplier;

      // Smoothing
      const prev = smoothedRef.current;
      let sx = anchorX, sy = anchorY, sw = targetWidthPx, sRoll = rollDeg, sYaw = yawDeg, sPitch = pitchDeg;
      if (prev) {
        const moved = Math.hypot(anchorX - prev.x, anchorY - prev.y) > smoothing.deadZonePx;
        sx = moved ? lerp(prev.x, anchorX, smoothing.positionAlpha) : prev.x;
        sy = moved ? lerp(prev.y, anchorY, smoothing.positionAlpha) : prev.y;
        sw = lerp(prev.widthPx, targetWidthPx, smoothing.scaleAlpha);
        sRoll = lerp(prev.rollDeg, rollDeg, smoothing.angleAlpha);
        sYaw = lerp(prev.yawDeg, yawDeg, smoothing.angleAlpha);
        sPitch = lerp(prev.pitchDeg, pitchDeg, smoothing.angleAlpha);
      }
      smoothedRef.current = { x: sx, y: sy, widthPx: sw, rollDeg: sRoll, yawDeg: sYaw, pitchDeg: sPitch };

      setTransform(
        `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) translate(-50%, -50%) ` +
        `rotate(${sRoll.toFixed(2)}deg) perspective(${TRY_ON_CONFIG.perspectivePx}px) ` +
        `rotateY(${sYaw.toFixed(2)}deg) rotateX(${sPitch.toFixed(2)}deg)`,
      );
      setScale(Math.round(sw));
    } catch { /* frame transients */ }

    scheduleNextFrame(video, tickRef.current!, rafRef);
  }, [scaleMultiplier]);

  /* ── Start camera ──────────────────────────────────────── */
  const start = useCallback(async () => {
    setError(null);
    setStatus("loading-model");

    try {
      const { delegate } = await loadFaceLandmarker();
      delegateRef.current = delegate;
    } catch {
      setStatus("error");
      setError(TRY_ON_CONFIG.messages.modelError);
      return;
    }

    setStatus("starting-camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: TRY_ON_CONFIG.videoConstraints,
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("video-element-missing");
      video.srcObject = stream;
      if (video.readyState < 1) {
        await new Promise<void>((resolve) => {
          const onReady = () => { video.removeEventListener("loadedmetadata", onReady); resolve(); };
          video.addEventListener("loadedmetadata", onReady);
        });
      }
      await video.play();
    } catch (err) {
      stopCamera();
      setStatus("error");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(TRY_ON_CONFIG.messages.cameraDenied);
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError(TRY_ON_CONFIG.messages.cameraNotFound);
      } else if (name === "NotReadableError") {
        setError(TRY_ON_CONFIG.messages.cameraInUse);
      } else {
        setError(TRY_ON_CONFIG.messages.modelError);
      }
      return;
    }

    setStatus("running");
    setIsFaceDetected(false);
    runningRef.current = true;
    if (videoRef.current) {
      scheduleNextFrame(videoRef.current, tickRef.current!, rafRef);
    }
  }, [scaleMultiplier]);

  /* ── Stop camera ───────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    frameCountRef.current = 0;
    lastSeenAtRef.current = 0;
    smoothedRef.current = null;
    setTransform(null);
    setScale(null);
    setIsFaceDetected(false);
  }, []);

  const stop = useCallback(() => {
    stopCamera();
    setStatus("idle");
    setError(null);
  }, [stopCamera]);

  /* ── File upload handler (static mode) ────────────────── */
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        faceImageRef.current = img;
        hasFaceRef.current = false;
        setTransform(null);
        setScale(null);
        setIsFaceDetected(false);
        detectStaticFace();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [detectStaticFace]);

  /* ── Draw loop (Canvas 2D) ─────────────────────────────── */
  const drawRef = useRef<number | null>(null);
  useEffect(() => {
    if (status !== "running" && !hasFaceSrc) return;
    const draw = () => {
      if (!runningRef.current && !hasFaceSrc) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const glassesImg = glassesImgRef.current;
      if (!canvas || !glassesImg) { drawRef.current = requestAnimationFrame(draw); return; }

      const container = containerRef.current;
      if (!container) { drawRef.current = requestAnimationFrame(draw); return; }
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { drawRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (hasFaceSrc) {
        // Static mode: draw the uploaded photo
        const faceImg = faceImageRef.current;
        if (faceImg) {
          ctx.drawImage(faceImg, 0, 0, canvas.width, canvas.height);
        }
      } else if (video && video.readyState >= 2) {
        // Live mode: draw mirrored video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw glasses overlay
      if (transform && glassesImg) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        const tMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        const rMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
        if (tMatch) {
          ctx.translate(parseFloat(tMatch[1]), parseFloat(tMatch[2]));
        }
        if (rMatch) ctx.rotate(parseFloat(rMatch[1]) * Math.PI / 180);
        const gw = scale || 200;
        const gh = gw * (glassesImg.naturalHeight / glassesImg.naturalWidth);
        const isOverlay = glassesImg.src.includes("sin-fondo") || glassesImg.src.endsWith(".png");
        ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";
        ctx.drawImage(glassesImg, -gw / 2, -gh / 2, gw, gh);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }

      drawRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = requestAnimationFrame(draw);
    return () => { if (drawRef.current !== null) cancelAnimationFrame(drawRef.current); };
  }, [status, transform, scale, hasFaceSrc]);

  /* ── Render UI ─────────────────────────────────────────── */
  const busy = status === "loading-model" || status === "starting-camera";
  const isLive = !hasFaceSrc;

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
        {/* Video (mirrored) */}
        {isLive && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
        )}

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-contain"
        />

        {/* Loading overlay */}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
              <ScanFace size={20} className="animate-spin text-[#008294]" />
              <span className="text-sm font-medium text-slate-700">
                {status === "loading-model" ? "Cargando motor de detección..." : "Activando cámara..."}
              </span>
            </div>
          </div>
        )}

        {/* Idle → CTA */}
        {status === "idle" && isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 px-6 text-center">
            <ScanFace size={44} className="text-slate-400" />
            <p className="text-sm text-slate-300">Pruébate esta montura en tiempo real con tu cámara.</p>
            <button
              onClick={() => void start()}
              className="flex items-center gap-2 rounded-xl bg-[#008294] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
            >
              <Camera size={18} />
              Activar cámara
            </button>
            <p className="text-xs text-slate-400">Tu video no se guarda ni se envía a ningún servidor.</p>
          </div>
        )}

        {/* Static mode: upload button if no face detected */}
        {status === "idle" && hasFaceSrc && !isFaceDetected && !busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 px-6 text-center">
            <Upload size={44} className="text-slate-400" />
            <p className="text-sm text-slate-300">Sube una foto frontal para probar la montura.</p>
            <label className="flex items-center gap-2 rounded-xl bg-[#008294] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b] cursor-pointer">
              Subir foto
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            <p className="text-xs text-slate-400">Usa una foto frontal con buena iluminación.</p>
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/85 px-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 text-center shadow-lg">
              <CameraOff size={32} className="text-red-500" />
              <p className="max-w-xs text-sm text-slate-700">{error}</p>
              <button
                onClick={() => void start()}
                className="mt-1 flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
              >
                <RefreshCcw size={16} />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Running */}
        {status === "running" && (
          <>
            {!isFaceDetected && (
              <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center px-4">
                <p className="rounded-full bg-black/55 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  {TRY_ON_CONFIG.messages.noFace}
                </p>
              </div>
            )}
            <button
              onClick={stop}
              className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow transition hover:bg-white"
            >
              <CameraOff size={14} />
              Detener
            </button>
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 backdrop-blur-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${isFaceDetected ? "animate-pulse bg-green-400" : "bg-slate-400"}`} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-white">
                {isFaceDetected ? "Rostro detectado" : "Buscando rostro"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}