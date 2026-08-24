"use client";

import { useCallback, useRef } from "react";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type { GlassesOverlayConfig, OverlayConfig, TempleArmTransform } from "../types/tryOn";

interface UseCanvasRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  render: (faceSrc: string, glassesSrc: string, overlay: OverlayConfig) => Promise<void>;
  renderWithOverlay: (faceSrc: string, glassesSrc: string, overlay: OverlayConfig) => Promise<void>;
  renderFallback: (faceSrc: string, glassesSrc: string) => Promise<void>;
  drawImageFrame: (image: HTMLImageElement, glassesImg: HTMLImageElement, overlay: OverlayConfig) => void;
  drawGlassesWithTemples: (
    faceImage: HTMLImageElement,
    glassesImage: HTMLImageElement,
    overlay: GlassesOverlayConfig,
    leftTempleImg: HTMLImageElement | null,
    rightTempleImg: HTMLImageElement | null,
  ) => void;
  download: () => void;
  clear: () => void;
}

export function useCanvasRenderer(): UseCanvasRendererReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(
    async (faceSrc: string, glassesSrc: string, overlay: OverlayConfig): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

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

      ctx = canvas.getContext("2d");
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

  const renderWithOverlay = useCallback(
    async (faceSrc: string, glassesSrc: string, overlay: OverlayConfig): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

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

      ctx = canvas.getContext("2d");
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

      let ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      ctx = canvas.getContext("2d");
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

  /**
   * Draw a single temple arm on the canvas with 3D perspective transforms.
   */
  const drawTempleArm = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      templeImg: HTMLImageElement,
      transform: TempleArmTransform,
    ): void => {
      if (transform.opacity < 0.01 || transform.length < 1) return;

      ctx.save();
      ctx.globalAlpha = transform.opacity;

      // Move to the anchor point (where the arm attaches to the frame)
      ctx.translate(transform.anchorX, transform.anchorY);
      ctx.rotate(transform.rotation);

      // Apply trapezoidal skew for perspective
      // skewX shifts the far end horizontally, creating depth illusion
      ctx.transform(
        transform.scaleX,     // a: horizontal scale
        transform.skewY,      // b: vertical skew
        transform.skewX,      // c: horizontal skew
        1,                    // d: vertical scale
        0,                    // e: horizontal translation
        0,                    // f: vertical translation
      );

      // Draw the temple arm image extending from the anchor point
      // The arm extends to the left (negative x in local coords) from the anchor
      // since we've rotated toward the ear direction
      const armWidth = transform.width;
      const armLength = transform.length;

      ctx.drawImage(
        templeImg,
        -armWidth / 2,   // center horizontally on anchor
        -armLength,       // extend upward (away from the frame)
        armWidth,
        armLength,
      );

      ctx.restore();
    },
    [],
  );

  /**
   * Draw the full glasses overlay: temples (behind), frontal frame, temples (in front).
   * The drawing order depends on head yaw to handle occlusion correctly.
   */
  const drawGlassesWithTemples = useCallback(
    (
      faceImage: HTMLImageElement,
      glassesImage: HTMLImageElement,
      overlay: GlassesOverlayConfig,
      leftTempleImg: HTMLImageElement | null,
      rightTempleImg: HTMLImageElement | null,
    ): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear and draw face
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(faceImage, 0, 0, canvas.width, canvas.height);

      const { centerX, centerY, rotation, glassesWidth, glassesHeight, verticalOffset } = overlay;

      // Determine drawing order based on yaw:
      // If yaw > 0 (looking right), left temple is in front, right is behind
      // If yaw < 0 (looking left), right temple is in front, left is behind
      const leftIsInFront = overlay.headPose.yaw >= 0;

      const behindTemple = leftIsInFront
        ? { img: rightTempleImg, transform: overlay.rightTemple }
        : { img: leftTempleImg, transform: overlay.leftTemple };
      const inFrontTemple = leftIsInFront
        ? { img: leftTempleImg, transform: overlay.leftTemple }
        : { img: rightTempleImg, transform: overlay.rightTemple };

      // Guarda anti-duplicado: nunca dibujar el PNG frontal como pata.
      const isUsableTemple = (templeImg: HTMLImageElement | null): boolean =>
        !!templeImg && templeImg.src !== glassesImage.src;

      // 1. Draw temple arm that goes BEHIND the face
      if (behindTemple.img && behindTemple.transform && isUsableTemple(behindTemple.img)) {
        drawTempleArm(ctx, behindTemple.img, behindTemple.transform);
      }

      // 2. Draw the frontal frame (bridge + lenses)
      ctx.save();
      ctx.translate(centerX, centerY + (verticalOffset || 0));
      ctx.rotate(rotation);

      const isFrontalOverlay =
        glassesImage.src.includes("sin-fondo") || glassesImage.src.endsWith(".png");
      ctx.globalCompositeOperation = isFrontalOverlay ? "source-over" : "multiply";

      ctx.drawImage(
        glassesImage,
        -glassesWidth / 2,
        -glassesHeight / 2,
        glassesWidth,
        glassesHeight,
      );
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      // 3. Draw temple arm that goes IN FRONT of the face
      if (inFrontTemple.img && inFrontTemple.transform && isUsableTemple(inFrontTemple.img)) {
        drawTempleArm(ctx, inFrontTemple.img, inFrontTemple.transform);
      }
    },
    [drawTempleArm],
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

  return {
    canvasRef,
    render,
    renderWithOverlay,
    renderFallback,
    drawImageFrame,
    drawGlassesWithTemples,
    download,
    clear,
  };
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
