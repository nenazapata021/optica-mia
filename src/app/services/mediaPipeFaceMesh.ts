import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type {
  FaceLandmarks,
  OverlayConfig,
  Point,
  RunningMode,
} from "../types/tryOn";

type NormalizedLandmark = { x: number; y: number; z: number };

// Factor configurable para ajustar tamaño de la montura por rostro
// Valor ~1.75 (rango solicitado: 1.5-2x distancia interpupilar)
export const GLASSES_SCALE_FACTOR = 1.75;
// Peso de anclaje vertical: 0 = centro exacto de ojos, 1 = puente de nariz (landmark 168)
export const NOSE_ANCHOR_WEIGHT = 0.5;

export class MediaPipeFaceMeshEngine {
  private static instance: MediaPipeFaceMeshEngine | null = null;

  private faceLandmarker: FaceLandmarker | null = null;
  private currentMode: RunningMode = "IMAGE";
  private loadPromise: Promise<void> | null = null;

  static getInstance(): MediaPipeFaceMeshEngine {
    if (!MediaPipeFaceMeshEngine.instance) {
      MediaPipeFaceMeshEngine.instance = new MediaPipeFaceMeshEngine();
    }
    return MediaPipeFaceMeshEngine.instance;
  }

  async load(mode: RunningMode = "IMAGE"): Promise<void> {
    if (this.faceLandmarker && this.currentMode === mode) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        TRY_ON_CONFIG.faceLandmarker.basePath,
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl,
          delegate: "GPU",
        },
        runningMode: mode,
        minFaceDetectionConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFaceDetectionConfidence,
        minFacePresenceConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFacePresenceConfidence,
        minTrackingConfidence:
          TRY_ON_CONFIG.faceLandmarker.minTrackingConfidence,
        outputFaceBlendshapes:
          TRY_ON_CONFIG.faceLandmarker.outputFaceBlendshapes,
        numFaces: TRY_ON_CONFIG.faceLandmarker.maxFaces,
      });

      this.currentMode = mode;
    })();

    return this.loadPromise;
  }

  async switchMode(mode: RunningMode): Promise<void> {
    if (this.currentMode === mode) return;
    this.loadPromise = null;
    this.faceLandmarker = null;
    await this.load(mode);
  }

  detectImage(
    image: HTMLImageElement | HTMLVideoElement,
  ): FaceLandmarkerResult | null {
    if (!this.faceLandmarker) return null;
    try {
      return this.faceLandmarker.detect(image);
    } catch {
      return null;
    }
  }

  detectVideo(
    video: HTMLVideoElement,
    timestamp: number,
  ): FaceLandmarkerResult | null {
    if (!this.faceLandmarker) return null;
    try {
      return this.faceLandmarker.detectForVideo(video, timestamp);
    } catch {
      return null;
    }
  }

  extractPreciseLandmarks(
    result: FaceLandmarkerResult,
  ): FaceLandmarks | null {
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

    const lm = result.faceLandmarks[0];
    const cfg = TRY_ON_CONFIG.faceMeshEngine;

    const leftEyeContour = this.extractContour(lm, cfg.leftEyeIndices);
    const rightEyeContour = this.extractContour(lm, cfg.rightEyeIndices);
    const faceOval = this.extractContour(lm, cfg.faceOvalIndices);

    // Iris tracking: usa el centro del iris (landmarks 468-477) cuando el modelo
    // los incluye, para superponer la montura exactamente sobre el ojo.
    const hasIris = lm.length >= cfg.minIrisLandmarks;
    const leftEye = hasIris
      ? this.computeCentroid(this.extractContour(lm, cfg.leftIrisIndices))
      : this.computeCentroid(leftEyeContour);
    const rightEye = hasIris
      ? this.computeCentroid(this.extractContour(lm, cfg.rightIrisIndices))
      : this.computeCentroid(rightEyeContour);
    const noseBridge = this.computeAveragePoint(lm, cfg.noseBridgeIndices);
    const noseTip = { x: lm[1].x, y: lm[1].y };
    const jawLeft = { x: lm[172].x, y: lm[172].y };
    const jawRight = { x: lm[397].x, y: lm[397].y };

    return {
      leftEye,
      rightEye,
      noseBridge,
      noseTip,
      jawLeft,
      jawRight,
      leftEyeContour,
      rightEyeContour,
      faceOval,
      imageWidth: 1,
      imageHeight: 1,
    };
  }

  calculateGlassesOverlay(
    landmarks: FaceLandmarks,
    imageNaturalWidth: number,
    imageNaturalHeight: number,
    glassesNaturalWidth: number,
    glassesNaturalHeight: number,
    scaleMultiplier = 1,
    glassesScaleFactor = GLASSES_SCALE_FACTOR,
  ): OverlayConfig {
    const leftPx = {
      x: landmarks.leftEye.x * imageNaturalWidth,
      y: landmarks.leftEye.y * imageNaturalHeight,
    };
    const rightPx = {
      x: landmarks.rightEye.x * imageNaturalWidth,
      y: landmarks.rightEye.y * imageNaturalHeight,
    };

    const eyeDX = rightPx.x - leftPx.x;
    const eyeDY = rightPx.y - leftPx.y;
    const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY);

    // Centro entre los ojos (usando landmarks 33 e 263 - iris centers from MediaPipe)
    const centerX = (leftPx.x + rightPx.x) / 2;

    // Anclaje vertical: promover hacia el puente de la nariz para mejor caída de patillas.
    // NOSE_ANCHOR_WEIGHT = 0.5 balancea entre centro de ojos y puente nasal (landmark 168).
    const noseBridgePx = {
      x: landmarks.noseBridge.x * imageNaturalWidth,
      y: landmarks.noseBridge.y * imageNaturalHeight,
    };
    const eyeMidY = (leftPx.y + rightPx.y) / 2;
    const centerY =
      eyeMidY * (1 - NOSE_ANCHOR_WEIGHT) + noseBridgePx.y * NOSE_ANCHOR_WEIGHT;

    const verticalOffset = 0;

    const faceWidth =
      Math.abs(landmarks.jawRight.x - landmarks.jawLeft.x) *
      imageNaturalWidth;

    // Usar factor configurable en lugar de FRAME_SCALE_FACTOR global
    const glassesWidth = eyeDistance * glassesScaleFactor * scaleMultiplier;
    const aspect = glassesNaturalHeight / glassesNaturalWidth;
    const glassesHeight = glassesWidth * aspect;

    const scale = faceWidth > 0 ? glassesWidth / faceWidth : 1;

    // Rotación basada en la línea entre los ojos para seguimiento natural de cabeza
    const rotation = Math.atan2(eyeDY, eyeDX);

    return {
      centerX,
      centerY,
      scale,
      rotation,
      eyeDistance,
      glassesWidth,
      glassesHeight,
      verticalOffset,
      leftTempleOpacity: 1,
      rightTempleOpacity: 1,
    };
  }

  isLoaded(): boolean {
    return this.faceLandmarker !== null;
  }

  private extractContour(
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
  ): Point[] {
    return indices
      .filter((i) => i < landmarks.length)
      .map((i) => ({ x: landmarks[i].x, y: landmarks[i].y }));
  }

  private computeCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  private computeAveragePoint(
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
  ): Point {
    const valid = indices.filter((i) => i < landmarks.length);
    if (valid.length === 0) return { x: 0, y: 0 };
    const sum = valid.reduce(
      (acc, i) => ({ x: acc.x + landmarks[i].x, y: acc.y + landmarks[i].y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / valid.length, y: sum.y / valid.length };
  }
}
