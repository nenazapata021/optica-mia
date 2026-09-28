"use client";

import { useCallback, useRef } from "react";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { GlassesOverlayConfig, OverlayConfig } from "../types/tryOn";
import type { FaceLandmarks } from "../types/tryOn";

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  renderWithOverlay: (faceSrc: string, glassesSrc: string, overlay: OverlayConfig) => Promise<void>;
  renderFallback: (faceSrc: string, glassesSrc: string) => Promise<void>;
  drawImageFrame: (image: HTMLImageElement, glassesImg: HTMLImageElement, overlay: OverlayConfig) => void;
  download: (
    faceImage: HTMLImageElement,
    glassesImage: HTMLImageElement,
    overlay: GlassesOverlayConfig,
    landmarks: FaceLandmarks,
  ) => Promise<void>;
  clear: () => void;
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

export function useCanvasRenderer(): UseCanvasRendererReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawFrame = useCallback(
    async (faceSrc: string, glassesSrc: string, overlay: OverlayConfig, withTemples: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const [faceImg, glassesImg] = await Promise.all([loadImage(faceSrc), loadImage(glassesSrc)]);

      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      const maxW = TRY_ON_CONFIG.canvas.maxWidth;
      if (w > maxW) { h = Math.round((h / w) * maxW); w = maxW; }

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(faceImg, 0, 0, w, h);
      ctx.save();
      ctx.translate(overlay.centerX, overlay.centerY);
      ctx.rotate(overlay.rotation);
      const isOverlay = glassesSrc.includes("sin-fondo") || glassesSrc.endsWith(".png");
      ctx.globalCompositeOperation = isOverlay ? "source-over" : "multiply";
      ctx.drawImage(glassesImg, -overlay.glassesWidth / 2, -overlay.glassesHeight / 2, overlay.glassesWidth, overlay.glassesHeight);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    [],
  );

  const renderWithOverlay = useCallback(
    async (faceSrc: string, glassesSrc: string, overlay: OverlayConfig): Promise<void> => {
      await drawFrame(faceSrc, glassesSrc, overlay, true);
    },
    [drawFrame],
  );

  const renderFallback = useCallback(
    async (faceSrc: string, glassesSrc: string): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const faceImg = await loadImage(faceSrc);
      const glassesImg = await loadImage(glassesSrc);

      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      const maxW = TRY_ON_CONFIG.canvas.maxWidth;
      if (w > maxW) { h = Math.round((h / w) * maxW); w = maxW; }
      canvas.width = w;
      canvas.height = h;

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
    async (image: HTMLImageElement, glassesImg: HTMLImageElement, overlay: OverlayConfig): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      ctx.save();
      ctx.translate(overlay.centerX, overlay.centerY);
      ctx.rotate(overlay.rotation);
      const isFrontalOverlay = glassesImg.src.includes("sin-fondo") || glassesImg.src.endsWith(".png");
      ctx.globalCompositeOperation = isFrontalOverlay ? "source-over" : "multiply";
      ctx.drawImage(glassesImg, -overlay.glassesWidth / 2, -overlay.glassesHeight / 2, overlay.glassesWidth, overlay.glassesHeight);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    [],
  );

  const download = useCallback(
    async (
      faceImage: HTMLImageElement,
      glassesImage: HTMLImageElement,
      overlay: GlassesOverlayConfig,
      landmarks: FaceLandmarks,
    ): Promise<void> => {
      const outputSize = 1024;
      const marginRatio = 0.18;
      const faceOval = landmarks.faceOval;
      if (!faceOval || faceOval.length === 0) return;

      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const pt of faceOval) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
      const cropWidthNorm = maxX - minX;
      const cropHeightNorm = maxY - minY;
      const faceCenterXNorm = (minX + maxX) / 2;
      const faceCenterYNorm = (minY + maxY) / 2;
      const cropSizeNorm = Math.max(cropWidthNorm, cropHeightNorm);
      let cropLeft = faceCenterXNorm - cropSizeNorm / 2;
      let cropTop = faceCenterYNorm - cropSizeNorm / 2;
      if (cropLeft < 0) cropLeft = 0;
      if (cropTop < 0) cropTop = 0;
      if (cropLeft + cropSizeNorm > 1) cropLeft = 1 - cropSizeNorm;
      if (cropTop + cropSizeNorm > 1) cropTop = 1 - cropSizeNorm;

      const srcW = faceImage.naturalWidth;
      const srcH = faceImage.naturalHeight;
      const sx = Math.round(cropLeft * srcW);
      const sy = Math.round(cropTop * srcH);
      const sWidth = Math.round(cropSizeNorm * srcW);
      const sHeight = Math.round(cropSizeNorm * srcH);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = outputSize;
      outCanvas.height = outputSize;
      const octx = outCanvas.getContext("2d");
      if (!octx) return;
      octx.drawImage(faceImage, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);

      const scaleX = outputSize / sWidth;
      const scaleY = outputSize / sHeight;
      const centerX = (overlay.centerX - sx) * scaleX;
      const centerY = (overlay.centerY - sy) * scaleY + (overlay.verticalOffset || 0) * scaleY;
      const glassesWidth = overlay.glassesWidth * scaleX;
      const glassesHeight = overlay.glassesHeight * scaleY;
      const rotation = overlay.rotation;

      octx.save();
      octx.translate(centerX, centerY);
      octx.rotate(rotation);
      const isFrontalOverlay = glassesImage.src.includes("sin-fondo") || glassesImage.src.endsWith(".png");
      octx.globalCompositeOperation = isFrontalOverlay ? "source-over" : "multiply";
      octx.drawImage(glassesImage, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
      octx.globalCompositeOperation = "source-over";
      octx.restore();

      const link = document.createElement("a");
      link.download = "simulacion-optica-mia-1024.jpg";
      link.href = outCanvas.toDataURL("image/jpeg", 0.92);
      link.click();
    },
    [],
  );

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return { canvasRef, renderWithOverlay, renderFallback, drawImageFrame, download, clear };
}

export default useCanvasRenderer;