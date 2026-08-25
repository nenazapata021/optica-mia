export interface Point {
  x: number;
  y: number;
}

/** 3D point with depth from MediaPipe z-coordinate. */
export interface Point3D extends Point {
  z: number;
}

export interface FaceLandmarks {
  /** Left eye center (with z-depth from iris or contour). */
  leftEye: Point3D;
  /** Right eye center (with z-depth from iris or contour). */
  rightEye: Point3D;
  /** Left eye inner corner (landmark 133). */
  leftEyeInnerCorner: Point3D;
  /** Right eye inner corner (landmark 362). */
  rightEyeInnerCorner: Point3D;
  noseBridge: Point;
  noseTip: Point;
  jawLeft: Point;
  jawRight: Point;
  leftEyeContour: Point[];
  rightEyeContour: Point[];
  faceOval: Point[];
  /** Landmark 234 — left ear / temple area (normalized). */
  earLeft: Point3D;
  /** Landmark 454 — right ear / temple area (normalized). */
  earRight: Point3D;
  /** Landmark 1 — nose tip with depth. */
  noseTip3D: Point3D;
  imageWidth: number;
  imageHeight: number;
}

/** Estimated head rotation angles in radians. */
export interface HeadPose {
  /** Horizontal rotation: negative = looking left, positive = looking right. Range ≈ [-π/2, π/2]. */
  yaw: number;
  /** Vertical rotation: negative = looking up, positive = looking down. Range ≈ [-π/4, π/4]. */
  pitch: number;
  /** In-plane rotation (roll), same as the existing `rotation` angle. */
  roll: number;
}

/** Canvas transform parameters for a single temple arm. */
export interface TempleArmTransform {
  /** Anchor X — attachment point near the ear/temple (px). */
  anchorX: number;
  /** Anchor Y — attachment point near the ear/temple (px). */
  anchorY: number;
  /** Apparent length of the arm in pixels. */
  length: number;
  /** Width of the arm in pixels. */
  width: number;
  /** Rotation angle in radians. */
  rotation: number;
  /** Horizontal skew factor for trapezoidal perspective. */
  skewX: number;
  /** Vertical skew factor for trapezoidal perspective. */
  skewY: number;
  /** Opacity 0-1: more opaque when facing the viewer. */
  opacity: number;
  /** Horizontal scale factor (compressed by perspective). */
  scaleX: number;
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
  leftTempleOpacity: number;
  rightTempleOpacity: number;
}

/** Full overlay config including head pose and temple arm transforms. */
export interface GlassesOverlayConfig extends OverlayConfig {
  headPose: HeadPose;
  leftTemple: TempleArmTransform;
  rightTemple: TempleArmTransform;
  /** Scale reference factor = currentIPD / referenceIPD. */
  scaleRefFactor: number;
}

export type RunningMode = "IMAGE" | "VIDEO";

export type ModalStep = "options" | "camera" | "detecting" | "result";

/** Estados del probador en vivo con webcam. */
export type TryOnLiveStatus =
  | "idle"
  | "loading-model"
  | "starting-camera"
  | "running"
  | "error";

/** Suavizado exponencial de la pose de la montura en vivo. */
export interface SmoothedFramePose {
  x: number;
  y: number;
  widthPx: number;
  rollDeg: number;
  yawDeg: number;
  pitchDeg: number;
}
