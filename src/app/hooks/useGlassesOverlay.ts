"use client";

import { useCallback, useEffect, useRef } from "react";
import type { FaceLandmarks, OverlayConfig } from "../types/tryOn";

export const GLASSES_SCALE_FACTOR = 1.75;
export const NOSE_ANCHOR_WEIGHT = 0.5;

export function useGlassesOverlay(
  landmarks: FaceLandmarks,
  canvasWidth: number,
  canvasHeight: number,
  glassesNaturalWidth: number,
  glassesNaturalHeight: number,
  scaleMultiplier: number = 1,
) {
  const recalculateRef = useRef(false);

  const recalculate = useCallback(() => {
    const leftEye = { x: landmarks.leftEye.x * canvasWidth, y: landmarks.leftEye.y * canvasHeight };
    const rightEye = { x: landmarks.rightEye.x * canvasWidth, y: landmarks.rightEye.y * canvasHeight };
    const noseBridge = { x: landmarks.noseBridge.x * canvasWidth, y: landmarks.noseBridge.y * canvasHeight };

    const eyeDX = rightEye.x - leftEye.x;
    const eyeDY = rightEye.y - leftEye.y;
    const eyeDistance = Math.hypot(eyeDX, eyeDY);

    const glassesWidth = eyeDistance * GLASSES_SCALE_FACTOR * scaleMultiplier;
    const aspect = glassesNaturalHeight / glassesNaturalWidth;
    const glassesHeight = glassesWidth * aspect;

    const centerX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const centerY = eyeMidY * (1 - NOSE_ANCHOR_WEIGHT) + noseBridge.y * NOSE_ANCHOR_WEIGHT;

    const rotation = Math.atan2(eyeDY, eyeDX);

    return {
      centerX,
      centerY,
      scale: glassesWidth / Math.max(canvasWidth, 1),
      rotation,
      eyeDistance,
      glassesWidth,
      glassesHeight,
      verticalOffset: 0,
      leftTempleOpacity: 1,
      rightTempleOpacity: 1,
    };
  }, [
    landmarks.leftEye,
    landmarks.leftEye,
    landmarks.rightEye,
    landmarks.noseBridge,
    canvasWidth,
    canvasHeight,
    scaleMultiplier,
    glassesNaturalWidth,
    glassesNaturalHeight,
  ]);

  useEffect(() => {
    if (recalculateRef.current) {
      recalculate();
      recalculateRef.current = false;
    }
  }, [recalculate]);

  return { recalculate, overlay: recalculate() };
}