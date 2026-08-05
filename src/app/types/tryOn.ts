export interface Point {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  noseBridge: Point;
  noseTip: Point;
  jawLeft: Point;
  jawRight: Point;
  leftEyeContour: Point[];
  rightEyeContour: Point[];
  faceOval: Point[];
  imageWidth: number;
  imageHeight: number;
}

export interface OverlayConfig {
  centerX: number;
  centerY: number;
  scale: number;
  rotation: number;
  eyeDistance: number;
  glassesWidth: number;
  glassesHeight: number;
  verticalOffset: number;
}

export type RunningMode = "IMAGE" | "VIDEO";

export type ModalStep = "options" | "camera" | "detecting" | "result";
