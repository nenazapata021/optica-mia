"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { SmoothedFramePose, TryOnLiveStatus } from "../types/tryOn";

/**
 * Motor singleton del FaceLandmarker (tasks-vision).
 * Se carga de forma diferida (dynamic import) solo al iniciar el probador.
 * Intenta GPU delegate; si falla, reintenta con CPU y activa throttling.
 */
let landmarkerPromise: Promise<{
  landmarker: FaceLandmarker;
  delegate: "GPU" | "CPU";
}> | null = null;

function getFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "/mediapipe/wasm",
      );
      const baseOptions = {
        modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl,
      };
      const commonOptions = {
        runningMode: "VIDEO" as const,
        numFaces: TRY_ON_CONFIG.faceLandmarker.maxFaces,
        minFaceDetectionConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFaceDetectionConfidence,
        minFacePresenceConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFacePresenceConfidence,
        minTrackingConfidence:
          TRY_ON_CONFIG.faceLandmarker.minTrackingConfidence,
        outputFaceBlendshapes: false,
      };
      try {
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: { ...baseOptions, delegate: "GPU" as const },
            ...commonOptions,
          },
        );
        return { landmarker, delegate: "GPU" as const };
      } catch {
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: { ...baseOptions, delegate: "CPU" as const },
            ...commonOptions,
          },
        );
        return { landmarker, delegate: "CPU" as const };
      }
    })();
  }
  return landmarkerPromise;
}

interface UseFaceTryOnOptions {
  /** Multiplicador fino por producto (Producto.scaleMultiplier). */
  scaleMultiplier?: number;
}

export interface UseFaceTryOnReturn {
  status: TryOnLiveStatus;
  error: string | null;
  /** CSS transform para el <img> de la montura. Null hasta detectar rostro. */
  transform: string | null;
  /** Ancho de la montura en px CSS. */
  scale: number | null;
  isFaceDetected: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  start: () => Promise<void>;
  stop: () => void;
}

/** Mapeo object-cover del frame de video al contenedor. */
interface CoverMapping {
  offsetX: number;
  offsetY: number;
  displayedW: number;
  displayedH: number;
}

function computeCoverMapping(
  videoW: number,
  videoH: number,
  containerW: number,
  containerH: number,
): CoverMapping {
  const coverScale = Math.max(containerW / videoW, containerH / videoH);
  const displayedW = videoW * coverScale;
  const displayedH = videoH * coverScale;
  return {
    offsetX: (containerW - displayedW) / 2,
    offsetY: (containerH - displayedH) / 2,
    displayedW,
    displayedH,
  };
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const lerp = (a: number, b: number, alpha: number) => a + (b - a) * alpha;

/** Programa el siguiente procesamiento sincronizado con el frame real del video. */
function scheduleNextFrame(
  video: HTMLVideoElement | null,
  tick: () => void,
  rafRef: { current: number | null },
): void {
  if (video && "requestVideoFrameCallback" in video) {
    video.requestVideoFrameCallback(() => tick());
  } else {
    rafRef.current = requestAnimationFrame(tick);
  }
}

export function useFaceTryOn(
  frameImageUrl: string | null,
  options?: UseFaceTryOnOptions,
): UseFaceTryOnReturn {
  const [status, setStatus] = useState<TryOnLiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transform, setTransform] = useState<string | null>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const frameCountRef = useRef(0);
  const delegateRef = useRef<"GPU" | "CPU">("GPU");
  const lastSeenAtRef = useRef(0);
  const smoothedRef = useRef<SmoothedFramePose | null>(null);
  const optionsRef = useRef(options);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Loop por frame: detección + geometría + suavizado + estado.
   * Auto-referenciado vía tickRef para evitar dependencias circulares.
   */
  const tick = useCallback(async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!runningRef.current) return;
    if (!video || !container || video.readyState < 2) {
      scheduleNextFrame(video, () => tickRef.current(), rafRef);
      return;
    }

    // Throttling en CPU: procesar 1 de cada N frames.
    frameCountRef.current += 1;
    if (
      delegateRef.current === "CPU" &&
      frameCountRef.current % TRY_ON_CONFIG.cpuThrottleDivisor !== 0
    ) {
      scheduleNextFrame(video, () => tickRef.current(), rafRef);
      return;
    }

    try {
      const { landmarker } = await getFaceLandmarker();
      if (!runningRef.current) return;

      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];
      const now = performance.now();

      if (!landmarks || landmarks.length < 478) {
        if (
          lastSeenAtRef.current > 0 &&
          now - lastSeenAtRef.current > TRY_ON_CONFIG.faceLostGraceMs
        ) {
          setIsFaceDetected(false);
        }
        scheduleNextFrame(video, () => tickRef.current(), rafRef);
        return;
      }

      lastSeenAtRef.current = now;
      setIsFaceDetected(true);

      const cfg = TRY_ON_CONFIG.liveEngine;
      const smoothing = TRY_ON_CONFIG.smoothing;
      const clamps = TRY_ON_CONFIG.clamps;

      // --- Mapeo object-cover: normalizado → px del contenedor ---
      const rect = container.getBoundingClientRect();
      const containerW = rect.width;
      const containerH = rect.height;
      if (containerW === 0 || containerH === 0) {
        scheduleNextFrame(video, () => tickRef.current(), rafRef);
        return;
      }
      const map = computeCoverMapping(
        video.videoWidth,
        video.videoHeight,
        containerW,
        containerH,
      );
      const toPxX = (nx: number) => nx * map.displayedW + map.offsetX;
      const toPxY = (ny: number) => ny * map.displayedH + map.offsetY;

      // --- Centroides de iris (468-472 y 473-477): ancla e IPD ---
      let lIx = 0;
      let lIy = 0;
      for (let i = 468; i <= 472; i++) {
        lIx += landmarks[i].x;
        lIy += landmarks[i].y;
      }
      lIx /= 5;
      lIy /= 5;
      let rIx = 0;
      let rIy = 0;
      for (let i = 473; i <= 477; i++) {
        rIx += landmarks[i].x;
        rIy += landmarks[i].y;
      }
      rIx /= 5;
      rIy /= 5;

      const leftIrisPx = { x: toPxX(lIx), y: toPxY(lIy) };
      const rightIrisPx = { x: toPxX(rIx), y: toPxY(rIy) };

      // Ancla base: punto medio entre ambos ojos
      const anchorXRaw = (leftIrisPx.x + rightIrisPx.x) / 2;

      // IPD en px reales → define el escalado
      const ipdPx = Math.hypot(
        rightIrisPx.x - leftIrisPx.x,
        rightIrisPx.y - leftIrisPx.y,
      );

      // Anclaje vertical: mezcla entrecejo (6) ↔ puente nasal (168)
      const glabellaY = toPxY(landmarks[cfg.glabellaIndex].y);
      const noseBridgeY = toPxY(landmarks[cfg.noseBridgeIndex].y);
      const anchorY = (glabellaY + noseBridgeY) / 2;

      // --- Roll: ángulo entre pómulos/sienes (127, 356) ---
      const cheekL = landmarks[cfg.cheekLeftIndex];
      const cheekR = landmarks[cfg.cheekRightIndex];
      const rollDeg =
        (Math.atan2(
          toPxY(cheekR.y) - toPxY(cheekL.y),
          toPxX(cheekR.x) - toPxX(cheekL.x),
        ) *
          180) /
        Math.PI;

      // --- Yaw/Pitch: geometría 3D de la nariz (1, 4, 5) ---
      const noseTip = landmarks[cfg.noseTipIndex];
      const noseBase = landmarks[cfg.noseBaseIndex];
      const noseBridgeLower = landmarks[cfg.noseBridgeLowerIndex];
      const noseMidX = (noseBase.x + noseBridgeLower.x) / 2;
      const noseMidY = (noseBase.y + noseBridgeLower.y) / 2;
      const noseMidZ = (noseBase.z + noseBridgeLower.z) / 2;

      // Offset 2D del tip respecto al eje nasal, normalizado por IPD
      const ipdNorm = Math.hypot(rIx - lIx, rIy - lIy) || 1e-6;
      const dxNorm = (noseTip.x - noseMidX) / ipdNorm;
      const dyNorm = (noseTip.y - noseMidY) / ipdNorm;

      // Asimetría Z: girar la cabeza acerca un lado y aleja el otro;
      // mirar arriba/abajo separa el tip del plano naso-maxilar.
      const yawFromZ = Math.atan2(noseMidZ - noseTip.z, 0.35);
      const yawFromX = Math.asin(clamp(dxNorm * 1.4, -1, 1));
      const pitchFromZ = Math.atan2(noseTip.z - noseMidZ, 0.3);
      const pitchFromY = Math.asin(clamp(dyNorm * 1.8, -1, 1));

      const yawRad = clamp(yawFromZ * 0.55 + yawFromX * 0.45, -1.1, 1.1);
      const pitchRad = clamp(pitchFromZ * 0.5 + pitchFromY * 0.5, -0.9, 0.9);

      let rollFinal = rollDeg;
      let yawDeg = clamp(
        (yawRad * 180) / Math.PI,
        -clamps.maxYawDeg,
        clamps.maxYawDeg,
      );
      const pitchDeg = clamp(
        (pitchRad * 180) / Math.PI,
        -clamps.maxPitchDeg,
        clamps.maxPitchDeg,
      );

      // --- Espejo selfie: el <video> se muestra con scaleX(-1) ---
      let anchorX = anchorXRaw;
      if (TRY_ON_CONFIG.liveEngine.mirrorPreview) {
        anchorX = containerW - anchorXRaw;
        rollFinal = -rollFinal;
        yawDeg = -yawDeg;
      }

      // --- Escala objetivo: IPD_px × constante calibrada × multiplicador ---
      const multiplier = optionsRef.current?.scaleMultiplier ?? 1;
      const targetWidthPx =
        ipdPx * TRY_ON_CONFIG.baseFrameScale * multiplier;

      // --- Suavizado exponencial (lerp) + zona muerta anti-jitter ---
      const prev = smoothedRef.current;
      let sx = anchorX;
      let sy = anchorY;
      let sWidth = targetWidthPx;
      let sRoll = rollFinal;
      let sYaw = yawDeg;
      let sPitch = pitchDeg;

      if (prev) {
        const moved =
          Math.hypot(anchorX - prev.x, anchorY - prev.y) >
          smoothing.deadZonePx;
        sx = moved ? lerp(prev.x, anchorX, smoothing.positionAlpha) : prev.x;
        sy = moved ? lerp(prev.y, anchorY, smoothing.positionAlpha) : prev.y;
        sWidth = lerp(prev.widthPx, targetWidthPx, smoothing.scaleAlpha);
        sRoll = lerp(prev.rollDeg, rollFinal, smoothing.angleAlpha);
        sYaw = lerp(prev.yawDeg, yawDeg, smoothing.angleAlpha);
        sPitch = lerp(prev.pitchDeg, pitchDeg, smoothing.angleAlpha);
      }
      smoothedRef.current = {
        x: sx,
        y: sy,
        widthPx: sWidth,
        rollDeg: sRoll,
        yawDeg: sYaw,
        pitchDeg: sPitch,
      };

      // Valores cuantizados → si no cambian, React omite el re-render.
      setTransform(
        `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) translate(-50%, -50%) ` +
          `rotate(${sRoll.toFixed(2)}deg) perspective(${TRY_ON_CONFIG.perspectivePx}px) ` +
          `rotateY(${sYaw.toFixed(2)}deg) rotateX(${sPitch.toFixed(2)}deg)`,
      );
      setScale(Math.round(sWidth));
    } catch {
      // Error transitorio de un frame: continuar el loop.
    }

    scheduleNextFrame(video, () => tickRef.current(), rafRef);
  }, []);

  useEffect(() => {
    tickRef.current = () => {
      void tick();
    };
  }, [tick]);

  const teardown = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    frameCountRef.current = 0;
    lastSeenAtRef.current = 0;
    smoothedRef.current = null;
    setTransform(null);
    setScale(null);
    setIsFaceDetected(false);
  }, []);

  const start = useCallback(async () => {
    if (!frameImageUrl || runningRef.current) return;
    setError(null);

    setStatus("loading-model");
    try {
      const { delegate } = await getFaceLandmarker();
      delegateRef.current = delegate;
    } catch {
      setStatus("error");
      setError(TRY_ON_CONFIG.messages.modelErrorLive);
      return;
    }

    setStatus("starting-camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("video-element-missing");
      video.srcObject = stream;
      if (video.readyState < 1) {
        await new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadedmetadata", onReady);
            resolve();
          };
          video.addEventListener("loadedmetadata", onReady);
        });
      }
      await video.play();
    } catch (err) {
      teardown();
      setStatus("error");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(TRY_ON_CONFIG.messages.cameraDenied);
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError(TRY_ON_CONFIG.messages.cameraNotFound);
      } else {
        setError(TRY_ON_CONFIG.messages.detectionError);
      }
      return;
    }

    setStatus("running");
    setIsFaceDetected(false);
    runningRef.current = true;
    if (videoRef.current) {
      scheduleNextFrame(
        videoRef.current,
        () => tickRef.current(),
        rafRef,
      );
    }
  }, [frameImageUrl, teardown]);

  const stop = useCallback(() => {
    teardown();
    setStatus("idle");
    setError(null);
  }, [teardown]);

  // Cleanup al desmontar: detener stream y loops. El modelo singleton se
  // conserva en memoria para visitas repetidas al probador.
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
    status,
    error,
    transform,
    scale,
    isFaceDetected,
    videoRef,
    containerRef,
    start,
    stop,
  };
}
