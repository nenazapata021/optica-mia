export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  jawLeft: { x: number; y: number };
  jawRight: { x: number; y: number };
  imageWidth: number;
  imageHeight: number;
}

export interface OverlayConfig {
  centerX: number;
  centerY: number;
  scale: number;
  rotation: number;
  eyeDistance: number;
}

export type ModalStep = "options" | "camera" | "detecting" | "result";
