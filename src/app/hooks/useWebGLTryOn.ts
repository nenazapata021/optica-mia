"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlassesRenderer, GlassesModel, FrameMeta, loadFrameMeta } from "../services/webgl";
import { MediaPipeFaceMeshEngine } from "../services/mediaPipeFaceMesh";
import type { FaceLandmarks, GlassesOverlayConfig } from "../types/tryOn";

export interface UseWebGLTryOnOptions {
  scaleMultiplier?: number;
  frameMaterial?: GlassesModel["frameMaterial"];
  lensType?: GlassesModel["lensType"];
  enableContactShadows?: boolean;
  enableChromaticAberration?: boolean;
  enableSubsurface?: boolean;
  enableColorGrading?: boolean;
}

export interface UseWebGLTryOnReturn {
  isWebGLAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  renderer: GlassesRenderer | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  initialize: (faceImage: HTMLImageElement, glassesModel: GlassesModel) => Promise<void>;
  updateFrame: (landmarks: FaceLandmarks, overlayConfig: GlassesOverlayConfig) => void;
  render: () => void;
  downloadResult: (width?: number, height?: number) => Promise<Blob>;
  dispose: () => void;
}

const WEBGL_FEATURE_FLAG = "optica-mia-webgl-enabled";

function checkWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      alpha: true,
      antialias: true,
    });
    const available = !!gl;
    if (gl) {
      // Check for required extensions
      const ext = gl.getExtension("EXT_color_buffer_float");
      const ext2 = gl.getExtension("OES_texture_float_linear");
      return available && !!ext && !!ext2;
    }
    return false;
  } catch {
    return false;
  }
}

function getFeatureFlag(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(WEBGL_FEATURE_FLAG);
    return stored !== "false"; // Default to enabled
  } catch {
    return true;
  }
}

function setFeatureFlag(enabled: boolean): void {
  try {
    localStorage.setItem(WEBGL_FEATURE_FLAG, enabled.toString());
  } catch {
    // Ignore
  }
}

export function useWebGLTryOn(options: UseWebGLTryOnOptions = {}): UseWebGLTryOnReturn {
  const [isWebGLAvailable, setIsWebGLAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rendererRef = useRef<GlassesRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  const glassesModelRef = useRef<GlassesModel | null>(null);
  const landmarksRef = useRef<FaceLandmarks | null>(null);
  const overlayConfigRef = useRef<GlassesOverlayConfig | null>(null);
  const engineRef = useRef<MediaPipeFaceMeshEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);

  // Check WebGL availability on mount
  useEffect(() => {
    const available = checkWebGLAvailable() && getFeatureFlag();
    setIsWebGLAvailable(available);
    
    if (!available) {
      setError("WebGL 2.0 no disponible. Usando renderizador Canvas 2D.");
    }
  }, []);

  const initialize = useCallback(async (
    faceImage: HTMLImageElement,
    glassesModel: GlassesModel
  ): Promise<void> => {
    if (!isWebGLAvailable) {
      throw new Error("WebGL no disponible");
    }

    if (!canvasRef.current) {
      throw new Error("Canvas no disponible");
    }

    setIsLoading(true);
    setError(null);

    try {
      faceImageRef.current = faceImage;
      glassesModelRef.current = glassesModel;

      // Initialize MediaPipe engine for landmark extraction
      engineRef.current = MediaPipeFaceMeshEngine.getInstance();
      if (!engineRef.current.isLoaded()) {
        await engineRef.current.load("IMAGE");
      }

      // Create renderer
      const renderer = new GlassesRenderer({
        canvas: canvasRef.current,
        faceImage,
        faceLandmarks: landmarksRef.current!,
        overlayConfig: overlayConfigRef.current!,
        glassesModel,
        width: faceImage.naturalWidth,
        height: faceImage.naturalHeight,
        enableContactShadows: options.enableContactShadows ?? true,
        enableChromaticAberration: options.enableChromaticAberration ?? true,
        enableSubsurface: options.enableSubsurface ?? true,
        enableColorGrading: options.enableColorGrading ?? true,
        onProgress: (progress) => {
          console.log(`[WebGL] Loading: ${Math.round(progress * 100)}%`);
        },
      });

      await renderer.initialize();
      rendererRef.current = renderer;

      console.log("[WebGL] Renderer initialized successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido al inicializar WebGL";
      setError(message);
      console.error("[WebGL] Initialization failed:", err);
      
      // Disable WebGL feature flag on failure
      setFeatureFlag(false);
      setIsWebGLAvailable(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isWebGLAvailable, options]);

  const updateFrame = useCallback((
    landmarks: FaceLandmarks,
    overlayConfig: GlassesOverlayConfig
  ): void => {
    landmarksRef.current = landmarks;
    overlayConfigRef.current = overlayConfig;

    if (rendererRef.current) {
      rendererRef.current.updateLandmarks(landmarks, overlayConfig);
    }
  }, []);

  const render = useCallback((): void => {
    if (isRenderingRef.current || !rendererRef.current) return;
    
    isRenderingRef.current = true;
    try {
      rendererRef.current.render();
    } catch (err) {
      console.error("[WebGL] Render error:", err);
      setError(err instanceof Error ? err.message : "Error de renderizado");
    } finally {
      isRenderingRef.current = false;
    }
  }, []);

  const downloadResult = useCallback(async (
    width = 1024,
    height = 1024
  ): Promise<Blob> => {
    if (!rendererRef.current) {
      throw new Error("Renderer no inicializado");
    }
    
    return rendererRef.current.exportImage(width, height);
  }, []);

  const dispose = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    faceImageRef.current = null;
    glassesModelRef.current = null;
    landmarksRef.current = null;
    overlayConfigRef.current = null;
  }, []);

  // Start animation loop for live mode
  const startLiveLoop = useCallback(() => {
    if (animationFrameRef.current) return;
    
    const loop = () => {
      if (rendererRef.current && !isRenderingRef.current) {
        render();
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    
    loop();
  }, [render]);

  const stopLiveLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    isWebGLAvailable,
    isLoading,
    error,
    renderer: rendererRef.current,
    canvasRef,
    initialize,
    updateFrame,
    render,
    downloadResult,
    dispose,
  };
}

// Helper to create GlassesModel from product data
export async function createGlassesModelFromProduct(
  productId: string,
  productImageUrl: string,
  productData: {
    frameMaterial?: GlassesModel["frameMaterial"];
    lensType?: GlassesModel["lensType"];
    scaleMultiplier?: number;
  }
): Promise<GlassesModel> {
  const baseUrl = `/monturas/frames/${productId}`;
  
  // Try to load metadata
  let meta: FrameMeta | null = null;
  try {
    meta = await loadFrameMeta(`${baseUrl}/frame-meta.json`);
  } catch {
    console.warn(`[WebGL] No metadata found for ${productId}, using defaults`);
  }

  const frameMaterial = productData.frameMaterial || meta?.frameMaterial || "acetate";
  const lensType = productData.lensType || meta?.lensType || "clear";
  const scaleMultiplier = productData.scaleMultiplier ?? meta?.scaleMultiplier ?? 1.0;

  // Default anchor points (will be overridden by meta if available)
  const defaultAnchors = {
    leftEye: { x: -0.032, y: 0.002, z: 0.015 },
    rightEye: { x: 0.032, y: 0.002, z: 0.015 },
    noseBridge: { x: 0, y: 0.008, z: 0.02 },
    leftTemple: { x: -0.075, y: 0.005, z: 0.01 },
    rightTemple: { x: 0.075, y: 0.005, z: 0.01 },
  };

  return {
    id: productId,
    name: productId,
    glbUrl: `${baseUrl}/frame.glb`,
    metaUrl: `${baseUrl}/frame-meta.json`,
    frameMaterial,
    lensType,
    scaleMultiplier,
    anchorPoints: {
      leftEye: new (require("three").Vector3)(
        meta?.anchorPoints.leftEye.x ?? defaultAnchors.leftEye.x,
        meta?.anchorPoints.leftEye.y ?? defaultAnchors.leftEye.y,
        meta?.anchorPoints.leftEye.z ?? defaultAnchors.leftEye.z
      ),
      rightEye: new (require("three").Vector3)(
        meta?.anchorPoints.rightEye.x ?? defaultAnchors.rightEye.x,
        meta?.anchorPoints.rightEye.y ?? defaultAnchors.rightEye.y,
        meta?.anchorPoints.rightEye.z ?? defaultAnchors.rightEye.z
      ),
      noseBridge: new (require("three").Vector3)(
        meta?.anchorPoints.noseBridge.x ?? defaultAnchors.noseBridge.x,
        meta?.anchorPoints.noseBridge.y ?? defaultAnchors.noseBridge.y,
        meta?.anchorPoints.noseBridge.z ?? defaultAnchors.noseBridge.z
      ),
      leftTemple: new (require("three").Vector3)(
        meta?.anchorPoints.leftTemple.x ?? defaultAnchors.leftTemple.x,
        meta?.anchorPoints.leftTemple.y ?? defaultAnchors.leftTemple.y,
        meta?.anchorPoints.leftTemple.z ?? defaultAnchors.leftTemple.z
      ),
      rightTemple: new (require("three").Vector3)(
        meta?.anchorPoints.rightTemple.x ?? defaultAnchors.rightTemple.x,
        meta?.anchorPoints.rightTemple.y ?? defaultAnchors.rightTemple.y,
        meta?.anchorPoints.rightTemple.z ?? defaultAnchors.rightTemple.z
      ),
    },
    boundingBox: new (require("three").Box3)(
      new (require("three").Vector3)(...(meta?.boundingBox.min || [-0.08, -0.03, -0.01])),
      new (require("three").Vector3)(...(meta?.boundingBox.max || [0.08, 0.03, 0.01]))
    ),
  };
}

// Hook for static photo mode (simpler, no live loop)
export function useWebGLStaticTryOn(
  faceImage: HTMLImageElement | null,
  glassesModel: GlassesModel | null,
  landmarks: FaceLandmarks | null,
  overlayConfig: GlassesOverlayConfig | null,
  options: UseWebGLTryOnOptions = {}
): UseWebGLTryOnReturn {
  const webgl = useWebGLTryOn(options);
  const initializedRef = useRef(false);

  // Auto-initialize when all deps are ready
  useEffect(() => {
    if (initializedRef.current) return;
    if (!webgl.isWebGLAvailable) return;
    if (!faceImage || !glassesModel || !landmarks || !overlayConfig) return;
    if (webgl.isLoading) return;

    initializedRef.current = true;
    webgl.initialize(faceImage, glassesModel).catch((err) => {
      console.error("[WebGL] Auto-init failed:", err);
      initializedRef.current = false;
    });
  }, [webgl, faceImage, glassesModel, landmarks, overlayConfig]);

  // Update frame when landmarks change
  useEffect(() => {
    if (webgl.renderer && landmarks && overlayConfig) {
      webgl.updateFrame(landmarks, overlayConfig);
    }
  }, [webgl, landmarks, overlayConfig]);

  // Render when overlay changes
  useEffect(() => {
    if (webgl.renderer && overlayConfig) {
      webgl.render();
    }
  }, [webgl, overlayConfig]);

  return webgl;
}