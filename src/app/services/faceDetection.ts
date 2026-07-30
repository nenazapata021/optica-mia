import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { FaceLandmarks, OverlayConfig } from "../types/tryOn";

let faceLandmarker: FaceLandmarker | null = null;
let loadPromise: Promise<FaceLandmarker> | null = null;

export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) return faceLandmarker;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(TRY_ON_CONFIG.faceLandmarker.basePath);
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl,
        delegate: "GPU",
      },
      runningMode: TRY_ON_CONFIG.faceLandmarker.runningMode,
      minFaceDetectionConfidence: TRY_ON_CONFIG.faceLandmarker.minFaceDetectionConfidence,
      minFacePresenceConfidence: TRY_ON_CONFIG.faceLandmarker.minFacePresenceConfidence,
      minTrackingConfidence: TRY_ON_CONFIG.faceLandmarker.minTrackingConfidence,
      outputFaceBlendshapes: TRY_ON_CONFIG.faceLandmarker.outputFaceBlendshapes,
      numFaces: TRY_ON_CONFIG.faceLandmarker.maxFaces,
    });
    faceLandmarker = landmarker;
    return landmarker;
  })();

  return loadPromise;
}

function detectFace(image: HTMLImageElement | HTMLVideoElement): FaceLandmarkerResult | null {
  if (!faceLandmarker) return null;
  return faceLandmarker.detect(image);
}

function extractLandmarks(result: FaceLandmarkerResult): FaceLandmarks | null {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

  const l = result.faceLandmarks[0];

  const leftUpperLid = l[159] ?? l[133] ?? l[33];
  const rightUpperLid = l[386] ?? l[362] ?? l[263];

  return {
    leftEye: { x: leftUpperLid.x, y: leftUpperLid.y },
    rightEye: { x: rightUpperLid.x, y: rightUpperLid.y },
    noseTip: { x: l[1].x, y: l[1].y },
    jawLeft: { x: l[172].x, y: l[172].y },
    jawRight: { x: l[397].x, y: l[397].y },
    imageWidth: 1,
    imageHeight: 1,
  };
}

function landmarksToPixels(
  landmarks: FaceLandmarks,
  naturalWidth: number,
  naturalHeight: number,
): FaceLandmarks {
  return {
    leftEye: { x: landmarks.leftEye.x * naturalWidth, y: landmarks.leftEye.y * naturalHeight },
    rightEye: { x: landmarks.rightEye.x * naturalWidth, y: landmarks.rightEye.y * naturalHeight },
    noseTip: { x: landmarks.noseTip.x * naturalWidth, y: landmarks.noseTip.y * naturalHeight },
    jawLeft: { x: landmarks.jawLeft.x * naturalWidth, y: landmarks.jawLeft.y * naturalHeight },
    jawRight: { x: landmarks.jawRight.x * naturalWidth, y: landmarks.jawRight.y * naturalHeight },
    imageWidth: naturalWidth,
    imageHeight: naturalHeight,
  };
}

export function calculateOverlayConfig(landmarks: FaceLandmarks): OverlayConfig {
  const eyeDX = landmarks.rightEye.x - landmarks.leftEye.x;
  const eyeDY = landmarks.rightEye.y - landmarks.leftEye.y;
  const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY);

  const centerX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const centerY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;

  const verticalOffset = eyeDistance * TRY_ON_CONFIG.overlay.verticalOffsetRatio;

  const faceWidth = Math.abs(landmarks.jawRight.x - landmarks.jawLeft.x);
  const scale = eyeDistance > 0 ? (eyeDistance * TRY_ON_CONFIG.overlay.glassesWidthMultiplier) / faceWidth : 1;
  const rotation = Math.atan2(eyeDY, eyeDX);

  return { centerX, centerY: centerY + verticalOffset, scale, rotation, eyeDistance };
}

export async function detectFaceFromImageSource(
  source: HTMLImageElement | HTMLVideoElement,
): Promise<{ landmarks: FaceLandmarks; overlay: OverlayConfig } | { error: string }> {
  try {
    const result = detectFace(source);
    if (!result) return { error: TRY_ON_CONFIG.messages.detectionError };

    const rawLandmarks = extractLandmarks(result);
    if (!rawLandmarks) return { error: TRY_ON_CONFIG.messages.noFace };

    const nw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const nh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

    const landmarks = landmarksToPixels(rawLandmarks, nw, nh);
    const overlay = calculateOverlayConfig(landmarks);

    return { landmarks, overlay };
  } catch {
    return { error: TRY_ON_CONFIG.messages.detectionError };
  }
}

export function isFaceLandmarkerLoaded(): boolean {
  return faceLandmarker !== null;
}
