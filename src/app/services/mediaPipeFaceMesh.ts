import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { TRY_ON_CONFIG } from "../config/tryOn";
import type {
  FaceLandmarks,
  GlassesOverlayConfig,
  HeadPose,
  Point,
  Point3D,
  RunningMode,
  TempleArmTransform,
} from "../types/tryOn";

type NormalizedLandmark = { x: number; y: number; z: number };

export const GLASSES_SCALE_FACTOR = 1.75;
export const NOSE_ANCHOR_WEIGHT = 0.5;

export class MediaPipeFaceMeshEngine {
  private static instance: MediaPipeFaceMeshEngine | null = null;

  private faceLandmarker: FaceLandmarker | null = null;
  private currentMode: RunningMode = "IMAGE";
  private loadPromise: Promise<void> | null = null;

  static getInstance(): MediaPipeFaceMeshEngine {
    if (!MediaPipeFaceMeshEngine.instance) {
      MediaPipeFaceMeshEngine.instance = new MediaPipeFaceMeshEngine();
    }
    return MediaPipeFaceMeshEngine.instance;
  }

  async load(mode: RunningMode = "IMAGE"): Promise<void> {
    if (this.faceLandmarker && this.currentMode === mode) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        TRY_ON_CONFIG.faceLandmarker.basePath,
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: TRY_ON_CONFIG.faceLandmarker.modelUrl,
          delegate: "GPU",
        },
        runningMode: mode,
        minFaceDetectionConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFaceDetectionConfidence,
        minFacePresenceConfidence:
          TRY_ON_CONFIG.faceLandmarker.minFacePresenceConfidence,
        minTrackingConfidence:
          TRY_ON_CONFIG.faceLandmarker.minTrackingConfidence,
        outputFaceBlendshapes:
          TRY_ON_CONFIG.faceLandmarker.outputFaceBlendshapes,
        numFaces: TRY_ON_CONFIG.faceLandmarker.maxFaces,
      });

      this.currentMode = mode;
    })();

    return this.loadPromise;
  }

  async switchMode(mode: RunningMode): Promise<void> {
    if (this.currentMode === mode) return;
    this.loadPromise = null;
    this.faceLandmarker = null;
    await this.load(mode);
  }

  detectImage(
    image: HTMLImageElement | HTMLVideoElement,
  ): FaceLandmarkerResult | null {
    if (!this.faceLandmarker) return null;
    try {
      return this.faceLandmarker.detect(image);
    } catch {
      return null;
    }
  }

  detectVideo(
    video: HTMLVideoElement,
    timestamp: number,
  ): FaceLandmarkerResult | null {
    if (!this.faceLandmarker) return null;
    try {
      return this.faceLandmarker.detectForVideo(video, timestamp);
    } catch {
      return null;
    }
  }

  extractPreciseLandmarks(
    result: FaceLandmarkerResult,
  ): FaceLandmarks | null {
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

    const lm = result.faceLandmarks[0];
    const cfg = TRY_ON_CONFIG.faceMeshEngine;

    const leftEyeContour = this.extractContour(lm, cfg.leftEyeIndices);
    const rightEyeContour = this.extractContour(lm, cfg.rightEyeIndices);
    const faceOval = this.extractContour(lm, cfg.faceOvalIndices);

    const hasIris = lm.length >= cfg.minIrisLandmarks;
    const leftEye = hasIris
      ? this.computeCentroid3D(lm, cfg.leftIrisIndices)
      : this.toPoint3D(this.computeCentroid(leftEyeContour), this.avgZ(lm, cfg.leftEyeIndices));
    const rightEye = hasIris
      ? this.computeCentroid3D(lm, cfg.rightIrisIndices)
      : this.toPoint3D(this.computeCentroid(rightEyeContour), this.avgZ(lm, cfg.rightEyeIndices));
    const noseBridge = this.computeAveragePoint(lm, cfg.noseBridgeIndices);

    // Ear landmarks with 3D depth from MediaPipe z-coordinate
    const earLeft: Point3D = {
      x: lm[cfg.earLeftIndex].x,
      y: lm[cfg.earLeftIndex].y,
      z: lm[cfg.earLeftIndex].z,
    };
    const earRight: Point3D = {
      x: lm[cfg.earRightIndex].x,
      y: lm[cfg.earRightIndex].y,
      z: lm[cfg.earRightIndex].z,
    };
    const noseTip3D: Point3D = {
      x: lm[cfg.noseTipIndex].x,
      y: lm[cfg.noseTipIndex].y,
      z: lm[cfg.noseTipIndex].z,
    };

    return {
      leftEye,
      rightEye,
      noseBridge,
      noseTip: { x: noseTip3D.x, y: noseTip3D.y },
      jawLeft: { x: lm[172].x, y: lm[172].y },
      jawRight: { x: lm[397].x, y: lm[397].y },
      leftEyeContour,
      rightEyeContour,
      faceOval,
      earLeft,
      earRight,
      noseTip3D,
      imageWidth: 1,
      imageHeight: 1,
    };
  }

  /**
   * Estimate head pose (yaw, pitch, roll) from face landmarks.
   * Uses both 2D geometry and MediaPipe z-depth for robustness.
   */
  extractHeadPose(landmarks: FaceLandmarks): HeadPose {
    const { leftEye, rightEye, earLeft, earRight, noseTip3D } = landmarks;

    // --- Roll (in-plane rotation) ---
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

    // --- Yaw (horizontal rotation) ---
    // Strategy: combine z-depth asymmetry of ears with 2D x-asymmetry of
    // nose tip relative to the eye midpoint.
    const eyeMidX = (leftEye.x + rightEye.x) / 2;

    // z-based yaw: ears should be roughly equidistant from camera when
    // face is frontal. Difference in z indicates rotation.
    const zAsymmetry = earRight.z - earLeft.z;

    // x-based yaw: nose tip shifts toward the side the face turns to.
    const noseOffsetX = noseTip3D.x - eyeMidX;

    // Combined yaw (weighted average for robustness)
    // zAsymmetry is typically in range [-0.1, 0.1] for moderate rotations
    // noseOffsetX is normalized, typically [-0.05, 0.05]
    const yawFromZ = Math.atan2(zAsymmetry, 0.15);
    const yawFromX = Math.asin(Math.max(-1, Math.min(1, noseOffsetX * 5)));
    const yaw = yawFromZ * 0.6 + yawFromX * 0.4;

    // --- Pitch (vertical rotation) ---
    // Use nose tip z-distance relative to eye plane.
    // In MediaPipe, z increases going away from camera.
    const eyeAvgZ = (leftEye.z + rightEye.z) / 2;
    const noseRelZ = noseTip3D.z - eyeAvgZ;
    // Positive noseRelZ = nose is further from camera = looking down
    const pitch = Math.atan2(noseRelZ, 0.12);

    return { yaw, pitch, roll };
  }

  /**
   * Calculate temple arm transforms based on head pose and face geometry.
   */
  calculateTempleTransforms(
    landmarks: FaceLandmarks,
    headPose: HeadPose,
    imageWidth: number,
    imageHeight: number,
    glassesWidth: number,
    glassesHeight: number,
    rotation: number,
  ): { leftTemple: TempleArmTransform; rightTemple: TempleArmTransform } {
    const templeCfg = TRY_ON_CONFIG.temple;

    const earLeftPx = { x: landmarks.earLeft.x * imageWidth, y: landmarks.earLeft.y * imageHeight };
    const earRightPx = { x: landmarks.earRight.x * imageWidth, y: landmarks.earRight.y * imageHeight };

    // Glasses front edge in pixel space (left and right edges of the frontal frame)
    // The frontal is drawn centered at (centerX, centerY) with given rotation.
    const leftEyePx = { x: landmarks.leftEye.x * imageWidth, y: landmarks.leftEye.y * imageHeight };
    const rightEyePx = { x: landmarks.rightEye.x * imageWidth, y: landmarks.rightEye.y * imageHeight };
    const centerX = (leftEyePx.x + rightEyePx.x) / 2;
    const eyeMidY = (leftEyePx.y + rightEyePx.y) / 2;
    const noseBridgePx = { x: landmarks.noseBridge.x * imageWidth, y: landmarks.noseBridge.y * imageHeight };
    const centerY = eyeMidY * (1 - NOSE_ANCHOR_WEIGHT) + noseBridgePx.y * NOSE_ANCHOR_WEIGHT;

    // Front edge attachment points (where temple meets the frame)
    const halfWidth = glassesWidth / 2;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    // Left attachment: center - halfWidth along the rotated x-axis
    const leftAttachX = centerX - halfWidth * cosR;
    const leftAttachY = centerY - halfWidth * sinR;
    // Right attachment: center + halfWidth along the rotated x-axis
    const rightAttachX = centerX + halfWidth * cosR;
    const rightAttachY = centerY + halfWidth * sinR;

    const leftTemple = this.computeSingleTempleTransform(
      { x: leftAttachX, y: leftAttachY },
      earLeftPx,
      headPose.yaw,
      "left",
      templeCfg,
      rotation,
    );

    const rightTemple = this.computeSingleTempleTransform(
      { x: rightAttachX, y: rightAttachY },
      earRightPx,
      headPose.yaw,
      "right",
      templeCfg,
      rotation,
    );

    return { leftTemple, rightTemple };
  }

  calculateGlassesOverlay(
    landmarks: FaceLandmarks,
    imageNaturalWidth: number,
    imageNaturalHeight: number,
    glassesNaturalWidth: number,
    glassesNaturalHeight: number,
    scaleMultiplier = 1,
    glassesScaleFactor = GLASSES_SCALE_FACTOR,
  ): GlassesOverlayConfig {
    const leftPx = {
      x: landmarks.leftEye.x * imageNaturalWidth,
      y: landmarks.leftEye.y * imageNaturalHeight,
    };
    const rightPx = {
      x: landmarks.rightEye.x * imageNaturalWidth,
      y: landmarks.rightEye.y * imageNaturalHeight,
    };

    const eyeDX = rightPx.x - leftPx.x;
    const eyeDY = rightPx.y - leftPx.y;
    const eyeDistance = Math.sqrt(eyeDX * eyeDX + eyeDY * eyeDY);

    const centerX = (leftPx.x + rightPx.x) / 2;

    const noseBridgePx = {
      x: landmarks.noseBridge.x * imageNaturalWidth,
      y: landmarks.noseBridge.y * imageNaturalHeight,
    };
    const eyeMidY = (leftPx.y + rightPx.y) / 2;
    const centerY =
      eyeMidY * (1 - NOSE_ANCHOR_WEIGHT) + noseBridgePx.y * NOSE_ANCHOR_WEIGHT;

    const verticalOffset = 0;

    const faceWidth =
      Math.abs(landmarks.jawRight.x - landmarks.jawLeft.x) *
      imageNaturalWidth;

    const glassesWidth = eyeDistance * glassesScaleFactor * scaleMultiplier;
    const aspect = glassesNaturalHeight / glassesNaturalWidth;
    const glassesHeight = glassesWidth * aspect;

    const scale = faceWidth > 0 ? glassesWidth / faceWidth : 1;

    const rotation = Math.atan2(eyeDY, eyeDX);

    // Dynamic scale reference factor
    const templeCfg = TRY_ON_CONFIG.temple;
    const scaleRefFactor = templeCfg.referenceIpdPx > 0
      ? eyeDistance / templeCfg.referenceIpdPx
      : 1;

    // Head pose estimation
    const headPose = this.extractHeadPose(landmarks);

    // Temple arm transforms
    const { leftTemple, rightTemple } = this.calculateTempleTransforms(
      landmarks,
      headPose,
      imageNaturalWidth,
      imageNaturalHeight,
      glassesWidth,
      glassesHeight,
      rotation,
    );

    return {
      centerX,
      centerY,
      scale,
      rotation,
      eyeDistance,
      glassesWidth,
      glassesHeight,
      verticalOffset,
      leftTempleOpacity: leftTemple.opacity,
      rightTempleOpacity: rightTemple.opacity,
      headPose,
      leftTemple,
      rightTemple,
      scaleRefFactor,
    };
  }

  isLoaded(): boolean {
    return this.faceLandmarker !== null;
  }

  private computeSingleTempleTransform(
    attachPoint: Point,
    earPoint: Point,
    yaw: number,
    side: "left" | "right",
    templeCfg: (typeof TRY_ON_CONFIG)["temple"],
    frameRotation: number,
  ): TempleArmTransform {
    // Direction vector from attachment point toward the ear
    const dx = earPoint.x - attachPoint.x;
    const dy = earPoint.y - attachPoint.y;
    const distToEar = Math.sqrt(dx * dx + dy * dy);

    // Angle from attachment toward ear (in world coordinates)
    const angleToEar = Math.atan2(dy, dx);

    // How much this side is visible based on yaw:
    // For the left temple, yaw > 0 (looking right) makes left temple more visible
    // For the right temple, yaw < 0 (looking left) makes right temple more visible
    const sideSign = side === "left" ? 1 : -1;
    // Visibility factor: 1 = fully visible (facing viewer), 0 = hidden (turned away)
    const cosYaw = Math.cos(yaw);
    const sideVisibility = side === "left"
      ? Math.max(0, cosYaw + sideSign * Math.sin(yaw) * 0.3)
      : Math.max(0, cosYaw - sideSign * Math.sin(yaw) * 0.3);
    const visibility = Math.max(0, Math.min(1, sideVisibility));

    // Apparent length: full length when visible, foreshortened when turned away
    const apparentLength = distToEar * (0.4 + 0.6 * visibility);

    // Width compression from perspective
    const scaleX = 0.3 + 0.7 * visibility;

    // Trapezoidal skew: the far end is narrower when the head is turned
    // For left arm: if yaw > 0, left arm recedes → skew right end narrower
    const skewAmount = Math.sin(yaw) * sideSign * 0.4;
    const skewX = -skewAmount;
    const skewY = 0;

    // Opacity: fade out when heavily turned away
    const opacity = templeCfg.minOpacity +
      (templeCfg.maxOpacity - templeCfg.minOpacity) * visibility;

    // Temple arm width
    const armWidth = templeCfg.baseWidthPx * scaleX;

    // Rotation of the arm: from attachment toward ear, plus the frame rotation
    const armRotation = angleToEar - frameRotation;

    return {
      anchorX: attachPoint.x,
      anchorY: attachPoint.y,
      length: apparentLength,
      width: armWidth,
      rotation: armRotation,
      skewX,
      skewY,
      opacity,
      scaleX,
    };
  }

  private extractContour(
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
  ): Point[] {
    return indices
      .filter((i) => i < landmarks.length)
      .map((i) => ({ x: landmarks[i].x, y: landmarks[i].y }));
  }

  private computeCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  private computeAveragePoint(
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
  ): Point {
    const valid = indices.filter((i) => i < landmarks.length);
    if (valid.length === 0) return { x: 0, y: 0 };
    const sum = valid.reduce(
      (acc, i) => ({ x: acc.x + landmarks[i].x, y: acc.y + landmarks[i].y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / valid.length, y: sum.y / valid.length };
  }

  private computeCentroid3D(
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
  ): Point3D {
    const valid = indices.filter((i) => i < landmarks.length);
    if (valid.length === 0) return { x: 0, y: 0, z: 0 };
    const sum = valid.reduce(
      (acc, i) => ({
        x: acc.x + landmarks[i].x,
        y: acc.y + landmarks[i].y,
        z: acc.z + landmarks[i].z,
      }),
      { x: 0, y: 0, z: 0 },
    );
    return {
      x: sum.x / valid.length,
      y: sum.y / valid.length,
      z: sum.z / valid.length,
    };
  }

  private avgZ(landmarks: NormalizedLandmark[], indices: readonly number[]): number {
    const valid = indices.filter((i) => i < landmarks.length);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, i) => sum + landmarks[i].z, 0) / valid.length;
  }

  private toPoint3D(p: Point, z: number): Point3D {
    return { x: p.x, y: p.y, z };
  }
}
