"use client";

import { useCallback, useRef } from "react";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { FaceLandmarks, OverlayConfig } from "../types/tryOn";

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  render: (faceSrc: string, glassesSrc: string, landmarks: FaceLandmarks) => Promise<void>;
  renderWithOverlay: (faceSrc: string, glassesSrc: string, overlay: OverlayConfig) => Promise<void>;
  renderFallback: (faceSrc: string, glassesSrc: string) => Promise<void>;
  drawImageFrame: (image: HTMLImageElement, glassesImg: HTMLImageElement, overlay: OverlayConfig) => void;
  download: () => void;
  clear: () => void;
}

export function useCanvasRenderer(): UseCanvasRendererReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(
    async (faceSrc: string, glassesSrc: string, landmarks: FaceLandmarks): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const faceImg = await loadImage(faceSrc);
      const glassesImg = await loadImage(glassesSrc);

      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      const maxW = TRY_ON_CONFIG.canvas.maxWidth;

      if (w > maxW) {
        h = Math.round((h / w) * maxW);
        w = maxW;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(faceImg, 0, 0, w, h);

      const ratio = w / faceImg.naturalWidth;

      const leftEyePx = { x: landmarks.leftEye.x * ratio, y: landmarks.leftEye.y * ratio };
      const rightEyePx = { x: landmarks.rightEye.x * ratio, y: landmarks.rightEye.y * ratio };

      let centerXPx = (leftEyePx.x + rightEyePx.x) / 2;
      let centerYPx = (leftEyePx.y + rightEyePx.y) / 2;
      let eyeDX = rightEyePx.x - leftEyePx.x;
      let eyeDY = rightEyePx.y - leftEyePx.y;
      let eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY);

      const rotation = Math.atan2(eyeDY, eyeDX);

      const glassesWidth = eyeDistance * TRY_ON_CONFIG.overlay.glassesWidthMultiplier;
      const aspect = glassesImg.naturalHeight / glassesImg.naturalWidth;
      const glassesHeight = glassesWidth * aspect;

      const verticalShift = eyeDistance * TRY_ON_CONFIG.overlay.verticalOffsetRatio;

      ctx.save();
      ctx.translate(centerXPx, centerYPx + verticalShift);
      ctx.rotate(rotation);

      const isOverlay = glassesSrc.includes("sin-fondo") || glassesSrc.endsWith(".png");
      ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";

      ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    [],
  );

  const renderWithOverlay = useCallback(
    async (faceSrc: string, glassesSrc: string, overlay: OverlayConfig): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const faceImg = await loadImage(faceSrc);
      const glassesImg = await loadImage(glassesSrc);

      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      const maxW = TRY_ON_CONFIG.canvas.maxWidth;

      if (w > maxW) {
        h = Math.round((h / w) * maxW);
        w = maxW;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(faceImg, 0, 0, w, h);

      ctx.save();
      ctx.translate(overlay.centerX, overlay.centerY);
      ctx.rotate(overlay.rotation);

      const isOverlay = glassesSrc.includes("sin-fondo") || glassesSrc.endsWith(".png");
      ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";

      ctx.drawImage(
        glassesImg,
        -overlay.glassesWidth / 2,
        -overlay.glassesHeight / 2,
        overlay.glassesWidth,
        overlay.glassesHeight,
      );
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    [],
  );

  const renderFallback = useCallback(
    async (faceSrc: string, glassesSrc: string): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const faceImg = await loadImage(faceSrc);
      const glassesImg = await loadImage(glassesSrc);

      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      const maxW = TRY_ON_CONFIG.canvas.maxWidth;

      if (w > maxW) {
        h = Math.round((h / w) * maxW);
        w = maxW;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(faceImg, 0, 0, w, h);

      const faceCenterX = w / 2;
      const faceCenterY = h * 0.37;

      const targetW = Math.round(0.35 * w);
      const aspect = glassesImg.naturalHeight / glassesImg.naturalWidth;
      const targetH = Math.round(targetW * aspect);

      const x = faceCenterX - targetW / 2;
      const y = faceCenterY - targetH / 2;

      const isOverlay = glassesSrc.includes("sin-fondo") || glassesSrc.endsWith(".png");
      ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";

      ctx.drawImage(glassesImg, x, y, targetW, targetH);
      ctx.globalCompositeOperation = "source-over";
    },
    [],
  );

  const drawImageFrame = useCallback(
    (image: HTMLImageElement, glassesImg: HTMLImageElement, overlay: OverlayConfig): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(image, 0, 0);

      ctx.save();
      ctx.translate(overlay.centerX, overlay.centerY);
      ctx.rotate(overlay.rotation);

      const isOverlay = glassesImg.src.includes("sin-fondo") || glassesImg.src.endsWith(".png");
      ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";

      ctx.drawImage(
        glassesImg,
        -overlay.glassesWidth / 2,
        -overlay.glassesHeight / 2,
        overlay.glassesWidth,
        overlay.glassesHeight,
      );
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    [],
  );

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "simulacion-optica-mia.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return { canvasRef, render, renderWithOverlay, renderFallback, drawImageFrame, download, clear };
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
