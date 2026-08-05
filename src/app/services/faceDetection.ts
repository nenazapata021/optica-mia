import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { MediaPipeFaceMeshEngine } from "./mediaPipeFaceMesh";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { FaceLandmarks, OverlayConfig, RunningMode } from "../types/tryOn";

export async function loadFaceLandmarker(
  mode: RunningMode = "IMAGE",
): Promise<void> {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  await engine.load(mode);
}

export function detectFace(
  image: HTMLImageElement | HTMLVideoElement,
): FaceLandmarkerResult | null {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  return engine.detectImage(image);
}

export function detectFaceFromVideo(
  video: HTMLVideoElement,
  timestamp: number,
): FaceLandmarkerResult | null {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  return engine.detectVideo(video, timestamp);
}

export function extractLandmarks(
  result: FaceLandmarkerResult,
): FaceLandmarks | null {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  return engine.extractPreciseLandmarks(result);
}

export function calculateOverlayConfig(landmarks: FaceLandmarks): OverlayConfig {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  return engine.calculateGlassesOverlay(
    landmarks,
    landmarks.imageWidth,
    landmarks.imageHeight,
    1,
    1,
  );
}

export async function detectFaceFromImageSource(
  source: HTMLImageElement | HTMLVideoElement,
): Promise<{ landmarks: FaceLandmarks; overlay: OverlayConfig } | { error: string }> {
  try {
    const engine = MediaPipeFaceMeshEngine.getInstance();

    const result = engine.detectImage(source);
    if (!result) return { error: TRY_ON_CONFIG.messages.detectionError };

    const rawLandmarks = engine.extractPreciseLandmarks(result);
    if (!rawLandmarks) return { error: TRY_ON_CONFIG.messages.noFace };

    const nw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const nh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

    rawLandmarks.imageWidth = nw;
    rawLandmarks.imageHeight = nh;

    const eyeDX = rawLandmarks.rightEye.x - rawLandmarks.leftEye.x;
    const eyeDY = rawLandmarks.rightEye.y - rawLandmarks.leftEye.y;
    const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY) * nw;
    const glassesWidth = eyeDistance * TRY_ON_CONFIG.faceMeshEngine.glassesWidthMultiplier;
    const overlay = engine.calculateGlassesOverlay(rawLandmarks, nw, nh, glassesWidth, glassesWidth * 0.35);

    return { landmarks: rawLandmarks, overlay };
  } catch {
    return { error: TRY_ON_CONFIG.messages.detectionError };
  }
}

export async function detectFaceFromVideoSource(
  video: HTMLVideoElement,
  timestamp: number,
): Promise<{ landmarks: FaceLandmarks; overlay: OverlayConfig } | { error: string }> {
  try {
    const engine = MediaPipeFaceMeshEngine.getInstance();

    const result = engine.detectVideo(video, timestamp);
    if (!result) return { error: TRY_ON_CONFIG.messages.detectionError };

    const rawLandmarks = engine.extractPreciseLandmarks(result);
    if (!rawLandmarks) return { error: TRY_ON_CONFIG.messages.noFace };

    const nw = video.videoWidth;
    const nh = video.videoHeight;

    rawLandmarks.imageWidth = nw;
    rawLandmarks.imageHeight = nh;

    const eyeDX = rawLandmarks.rightEye.x - rawLandmarks.leftEye.x;
    const eyeDY = rawLandmarks.rightEye.y - rawLandmarks.leftEye.y;
    const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY) * nw;
    const glassesWidth = eyeDistance * TRY_ON_CONFIG.faceMeshEngine.glassesWidthMultiplier;
    const overlay = engine.calculateGlassesOverlay(rawLandmarks, nw, nh, glassesWidth, glassesWidth * 0.35);

    return { landmarks: rawLandmarks, overlay };
  } catch {
    return { error: TRY_ON_CONFIG.messages.detectionError };
  }
}

export async function switchRunningMode(mode: RunningMode): Promise<void> {
  const engine = MediaPipeFaceMeshEngine.getInstance();
  await engine.switchMode(mode);
}

export function isFaceLandmarkerLoaded(): boolean {
  return MediaPipeFaceMeshEngine.getInstance().isLoaded();
}
