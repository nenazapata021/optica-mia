"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, ScanFace, RefreshCcw, Upload } from "lucide-react";
import { TRY_ON_CONFIG } from "../config/tryOn";

type TryOnStatus = "idle" | "pidiendo_permiso" | "cargando_modelo" | "starting-camera" | "running" | "error";

interface SmoothedPose {
  x: number; y: number; widthPx: number;
  rollDeg: number; yawDeg: number; pitchDeg: number;
}

interface GlassesTransform {
  x: number;
  y: number;
  widthPx: number;
  rollDeg: number;
  yawDeg: number;
  pitchDeg: number;
}

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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

let landmarkerCacheVideo: { landmarker: unknown; delegate: "GPU" | "CPU" } | null = null;
let landmarkerCacheImage: { landmarker: unknown; delegate: "GPU" | "CPU" } | null = null;

async function createLandmarker(runningMode: "VIDEO" | "IMAGE", delegate: "GPU" | "CPU") {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(TRY_ON_CONFIG.faceLandmarker.basePath);
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl, delegate },
    runningMode,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
  });
}

async function loadFaceLandmarker(runningMode: "VIDEO" | "IMAGE" = "VIDEO"): Promise<{ landmarker: unknown; delegate: "GPU" | "CPU" }> {
  const cache = runningMode === "VIDEO" ? landmarkerCacheVideo : landmarkerCacheImage;
  if (cache) return cache;

  try {
    const landmarker = await withTimeout(
      createLandmarker(runningMode, "GPU"),
      TRY_ON_CONFIG.timeouts.modelLoad,
      "MODEL_LOAD_TIMEOUT",
    );
    const result = { landmarker, delegate: "GPU" as const };
    if (runningMode === "VIDEO") landmarkerCacheVideo = result;
    else landmarkerCacheImage = result;
    return result;
  } catch (err) {
    if (err instanceof Error && err.message === "MODEL_LOAD_TIMEOUT") throw err;
    const landmarker = await withTimeout(
      createLandmarker(runningMode, "CPU"),
      TRY_ON_CONFIG.timeouts.modelLoad,
      "MODEL_LOAD_TIMEOUT",
    );
    const result = { landmarker, delegate: "CPU" as const };
    if (runningMode === "VIDEO") landmarkerCacheVideo = result;
    else landmarkerCacheImage = result;
    return result;
  }
}

interface VirtualTryOnProps {
  glassesFrontalImageUrl: string;
  faceSrc?: string;
  scaleMultiplier?: number;
}

export default function VirtualTryOn({ glassesFrontalImageUrl, faceSrc, scaleMultiplier = 1 }: VirtualTryOnProps) {
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [glassesTransform, setGlassesTransform] = useState<GlassesTransform | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startingRef = useRef(false);
  const frameCountRef = useRef(0);
  const delegateRef = useRef<"GPU" | "CPU">("GPU");
  const lastSeenAtRef = useRef(0);
  const smoothedRef = useRef<SmoothedPose | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  const hasFaceRef = useRef(false);
  const mountedRef = useRef(true);

  const hasFaceSrc = !!faceSrc && faceSrc !== "";

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (!cancelled && mountedRef.current) glassesImgRef.current = img; };
    img.src = glassesFrontalImageUrl;
    return () => { cancelled = true; };
  }, [glassesFrontalImageUrl]);

  const detectStaticFace = useCallback(async () => {
    const faceImg = faceImageRef.current;
    const glassesImg = glassesImgRef.current;
    if (!faceImg || !glassesImg) return;

    setStatus("cargando_modelo");
    try {
      const { landmarker } = await loadFaceLandmarker("IMAGE");
      if (!mountedRef.current) return;
      landmarkerRef.current = landmarker;

      const result = (landmarker as { detect: (img: HTMLImageElement) => { faceLandmarks?: { x: number; y: number; z: number }[][] } }).detect(faceImg);
      const landmarks = result.faceLandmarks?.[0];
      if (!landmarks || landmarks.length < 478) {
        setStatus("idle");
        setError(TRY_ON_CONFIG.messages.noFace);
        return;
      }

      const iw = faceImg.naturalWidth;
      const ih = faceImg.naturalHeight;

      const innerLeftPx = { x: landmarks[133].x * iw, y: landmarks[133].y * ih };
      const innerRightPx = { x: landmarks[362].x * iw, y: landmarks[362].y * ih };
      let anchorX = (innerLeftPx.x + innerRightPx.x) / 2;
      const anchorY = (innerLeftPx.y + innerRightPx.y) / 2;

      const cheekL = landmarks[TRY_ON_CONFIG.liveEngine.cheekLeftIndex];
      const cheekR = landmarks[TRY_ON_CONFIG.liveEngine.cheekRightIndex];
      let rollDeg = (Math.atan2(cheekR.y - cheekL.y, cheekR.x - cheekL.x) * 180) / Math.PI;

      const earLeft = landmarks[234];
      const earRight = landmarks[454];
      const templeDist = Math.hypot(
        (earRight.x - earLeft.x) * iw,
        (earRight.y - earLeft.y) * ih
      );
      const templeMargin = TRY_ON_CONFIG.temple?.templeMarginFactor ?? 1.1;
      const targetWidthPx = templeDist * templeMargin * scaleMultiplier;

      anchorX = iw - anchorX;
      rollDeg = -rollDeg;

      smoothedRef.current = { x: anchorX, y: anchorY, widthPx: targetWidthPx, rollDeg, yawDeg: 0, pitchDeg: 0 };

      setGlassesTransform({ x: anchorX, y: anchorY, widthPx: targetWidthPx, rollDeg, yawDeg: 0, pitchDeg: 0 });
      setIsFaceDetected(true);
      hasFaceRef.current = true;
      setStatus("idle");
    } catch {
      if (!mountedRef.current) return;
      setStatus("idle");
      setError(TRY_ON_CONFIG.messages.detectionError);
    }
  }, [scaleMultiplier]);

  useEffect(() => {
    if (!hasFaceSrc) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (!cancelled && mountedRef.current) { faceImageRef.current = img; detectStaticFace(); } };
    img.src = faceSrc;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceSrc, detectStaticFace]);

  const tick = useCallback(async () => {
    if (!runningRef.current || !mountedRef.current) return;
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
      if (!runningRef.current || !mountedRef.current) return;
      landmarkerRef.current = landmarker;

      const result = (landmarker as { detectForVideo: (video: HTMLVideoElement, timestamp: number) => { faceLandmarks?: { x: number; y: number; z: number }[][] } }).detectForVideo(video, performance.now());
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

      let lIx = 0, lIy = 0;
      for (let i = 468; i <= 472; i++) { lIx += landmarks[i].x; lIy += landmarks[i].y; }
      lIx /= 5; lIy /= 5;
      let rIx = 0, rIy = 0;
      for (let i = 473; i <= 477; i++) { rIx += landmarks[i].x; rIy += landmarks[i].y; }
      rIx /= 5; rIy /= 5;

      const innerLeftPx = { x: toPxX(landmarks[133].x), y: toPxY(landmarks[133].y) };
      const innerRightPx = { x: toPxX(landmarks[362].x), y: toPxY(landmarks[362].y) };
      let anchorX = (innerLeftPx.x + innerRightPx.x) / 2;
      const anchorY = (toPxY(landmarks[133].y) + toPxY(landmarks[362].y)) / 2;

      const cheekL = landmarks[cfg.cheekLeftIndex];
      const cheekR = landmarks[cfg.cheekRightIndex];
      let rollDeg = (Math.atan2(toPxY(cheekR.y) - toPxY(cheekL.y), toPxX(cheekR.x) - toPxX(cheekL.x)) * 180) / Math.PI;

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

      if (TRY_ON_CONFIG.liveEngine.mirrorPreview) {
        anchorX = cw - anchorX;
        rollDeg = -rollDeg;
        yawDeg = -yawDeg;
      }

      const multiplier = scaleMultiplier;
      const templeMargin = TRY_ON_CONFIG.temple?.templeMarginFactor ?? 1.1;
      const earLeft = landmarks[234];
      const earRight = landmarks[454];
      const earLeftPx = { x: toPxX(earLeft.x), y: toPxY(earLeft.y) };
      const earRightPx = { x: toPxX(earRight.x), y: toPxY(earRight.y) };
      const templeDist = Math.hypot(earRightPx.x - earLeftPx.x, earRightPx.y - earLeftPx.y);
      const targetWidthPx = templeDist * templeMargin * multiplier;

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

      setGlassesTransform({ x: sx, y: sy, widthPx: sw, rollDeg: sRoll, yawDeg: sYaw, pitchDeg: sPitch });
    } catch { /* frame transients */ }

    scheduleNextFrame(video, tickRef.current!, rafRef);
  }, [scaleMultiplier]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    startingRef.current = false;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    frameCountRef.current = 0;
    lastSeenAtRef.current = 0;
    smoothedRef.current = null;
    setGlassesTransform(null);
    setIsFaceDetected(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    setError(null);
    setStatus("cargando_modelo");

    try {
      const { delegate } = await loadFaceLandmarker();
      if (!mountedRef.current) { startingRef.current = false; return; }
      delegateRef.current = delegate;
    } catch (err) {
      startingRef.current = false;
      setStatus("error");
      if (err instanceof Error && err.message === "MODEL_LOAD_TIMEOUT") {
        setError(TRY_ON_CONFIG.messages.modelTimeout);
      } else {
        setError(TRY_ON_CONFIG.messages.modelError);
      }
      return;
    }

    setStatus("pidiendo_permiso");
    let stream: MediaStream;
    try {
      stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: TRY_ON_CONFIG.videoConstraints,
          audio: false,
        }),
        TRY_ON_CONFIG.timeouts.cameraPermission,
        "CAMERA_PERMISSION_TIMEOUT",
      );
    } catch (err) {
      startingRef.current = false;
      setStatus("error");
      if (err instanceof Error && err.message === "CAMERA_PERMISSION_TIMEOUT") {
        setError(TRY_ON_CONFIG.messages.cameraTimeout);
        return;
      }
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

    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      startingRef.current = false;
      return;
    }

    setStatus("starting-camera");
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      startingRef.current = false;
      setStatus("error");
      setError(TRY_ON_CONFIG.messages.cameraNotFound);
      return;
    }
    video.srcObject = stream;
    try {
      if (video.readyState < 1) {
        await withTimeout(
          new Promise<void>((resolve) => {
            const onReady = () => { video.removeEventListener("loadedmetadata", onReady); resolve(); };
            video.addEventListener("loadedmetadata", onReady);
          }),
          TRY_ON_CONFIG.timeouts.videoReady,
          "VIDEO_READY_TIMEOUT",
        );
      }
      await withTimeout(
        video.play(),
        TRY_ON_CONFIG.timeouts.videoPlay,
        "VIDEO_PLAY_TIMEOUT",
      );
    } catch (err) {
      stopCamera();
      setStatus("error");
      if (err instanceof Error && (err.message === "VIDEO_READY_TIMEOUT" || err.message === "VIDEO_PLAY_TIMEOUT")) {
        setError(TRY_ON_CONFIG.messages.cameraTimeout);
      } else {
        setError(TRY_ON_CONFIG.messages.cameraInUse);
      }
      return;
    }

    if (!mountedRef.current) {
      stopCamera();
      return;
    }

    setStatus("running");
    setIsFaceDetected(false);
    runningRef.current = true;
    if (videoRef.current) {
      scheduleNextFrame(videoRef.current, tickRef.current!, rafRef);
    }
  }, [stopCamera]);

  const stop = useCallback(() => {
    stopCamera();
    setStatus("idle");
    setError(null);
  }, [stopCamera]);

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
        setGlassesTransform(null);
        setIsFaceDetected(false);
        detectStaticFace();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [detectStaticFace]);

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
        const faceImg = faceImageRef.current;
        if (faceImg) {
          const coverScale = Math.max(canvas.width / faceImg.naturalWidth, canvas.height / faceImg.naturalHeight);
          const dw = faceImg.naturalWidth * coverScale;
          const dh = faceImg.naturalHeight * coverScale;
          const dx = (canvas.width - dw) / 2;
          const dy = (canvas.height - dh) / 2;
          ctx.drawImage(faceImg, dx, dy, dw, dh);
        }
      } else if (video && video.readyState >= 2) {
        const coverScale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const dw = video.videoWidth * coverScale;
        const dh = video.videoHeight * coverScale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, dx, dy, dw, dh);
        ctx.restore();
      }

      if (glassesTransform && glassesImg) {
        const gt = glassesTransform;
        const gw = gt.widthPx;
        const gh = gw * (glassesImg.naturalHeight / glassesImg.naturalWidth);

        ctx.save();
        ctx.translate(gt.x, gt.y);
        ctx.rotate((gt.rollDeg * Math.PI) / 180);

        const yawRad = (gt.yawDeg * Math.PI) / 180;
        const pitchRad = (gt.pitchDeg * Math.PI) / 180;
        const scaleX = Math.cos(yawRad);
        const scaleY = Math.cos(pitchRad);
        ctx.scale(scaleX, scaleY);

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
  }, [status, glassesTransform, hasFaceSrc]);

  const busy = status === "cargando_modelo" || status === "starting-camera" || status === "pidiendo_permiso";
  const isLive = !hasFaceSrc;

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-900 shadow-lg">
        {isLive && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
        )}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-contain"
        />

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
              <ScanFace size={20} className="animate-spin text-[#008294]" />
              <span className="text-sm font-medium text-slate-700">
                {status === "cargando_modelo" && "Cargando motor de detección..."}
                {status === "pidiendo_permiso" && "Esperando permiso de cámara..."}
                {status === "starting-camera" && "Activando cámara..."}
              </span>
            </div>
          </div>
        )}

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
