"use client";

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  Clock,
  Vector2,
  Vector3,
  Euler,
  Quaternion,
  Matrix4,
  Box3,
  Sphere,
  Color,
  Texture,
  CubeTexture,
  CubeCamera,
  PMREMGenerator,
  Mesh,
  Group,
  Object3D,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  DynamicDrawUsage,
  WebGLRenderTarget,
  HalfFloatType,
  RGBAFormat,
  LinearFilter,
  ClampToEdgeWrapping,
  SRGBColorSpace,
} from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

import { createLensMaterial, LensMaterialParams, DEFAULT_LENS_PARAMS, SUNGLASS_LENS_PARAMS } from "./LensMaterial";
import { createFrameMaterial, FrameMaterialType, NOSE_PAD_MATERIAL, TEMPLE_TIP_MATERIAL, HINGE_MATERIAL } from "./FrameMaterial";
import { ContactShadowPass, ContactShadowParams } from "./ContactShadowPass";
import { CompositePass, CompositePassParams } from "./CompositePass";
import { MediaPipeFaceMeshEngine } from "../mediaPipeFaceMesh";
import type { FaceLandmarks, GlassesOverlayConfig } from "../../types/tryOn";
import { TRY_ON_CONFIG } from "../../config/tryOn";

export interface GlassesModel {
  id: string;
  name: string;
  glbUrl: string;
  metaUrl: string;
  frameMaterial: FrameMaterialType;
  lensType: "clear" | "sunglass" | "polarized";
  lensParams?: Partial<LensMaterialParams>;
  scaleMultiplier: number;
  anchorPoints: {
    leftEye: Vector3;
    rightEye: Vector3;
    noseBridge: Vector3;
    leftTemple: Vector3;
    rightTemple: Vector3;
  };
  boundingBox: Box3;
}

export interface FrameMeta {
  id: string;
  name: string;
  frameMaterial: FrameMaterialType;
  lensType: "clear" | "sunglass" | "polarized";
  scaleMultiplier: number;
  anchorPoints: {
    leftEye: { x: number; y: number; z: number };
    rightEye: { x: number; y: number; z: number };
    noseBridge: { x: number; y: number; z: number };
    leftTemple: { x: number; y: number; z: number };
    rightTemple: { x: number; y: number; z: number };
  };
  boundingBox: { min: number[]; max: number[] };
  lensParams?: {
    ior?: number;
    thickness?: number;
    tintColor?: number;
    tintIntensity?: number;
  };
}

export interface GlassesRendererOptions {
  canvas: HTMLCanvasElement;
  faceImage: HTMLImageElement;
  faceLandmarks: FaceLandmarks;
  overlayConfig: GlassesOverlayConfig;
  glassesModel: GlassesModel;
  environmentMapUrl?: string;
  width: number;
  height: number;
  pixelRatio?: number;
  enableContactShadows?: boolean;
  enableChromaticAberration?: boolean;
  enableSubsurface?: boolean;
  enableColorGrading?: boolean;
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  texture: Texture;
  downloadBlob: (type?: string, quality?: number) => Promise<Blob>;
}

const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
  361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109,
];

export class GlassesRenderer {
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private faceCamera!: OrthographicCamera;
  private faceScene!: Scene;
  private clock!: Clock;
  private faceTexture!: Texture;
  private glassesGroup!: Group;
  private faceMesh!: Mesh;
  private environmentMap: CubeTexture | null = null;
  private pmremGenerator: PMREMGenerator | null = null;

  private contactShadowPass: ContactShadowPass | null = null;
  private compositePass: CompositePass | null = null;
  private glassesRenderTarget: WebGLRenderTarget | null = null;
  private shadowTexture: Texture | null = null;

  private options: GlassesRendererOptions;
  private initialized: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private animationFrameId: number | null = null;
  private disposed: boolean = false;

  constructor(options: GlassesRendererOptions) {
    this.options = {
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      enableContactShadows: true,
      enableChromaticAberration: true,
      enableSubsurface: true,
      enableColorGrading: true,
      environmentMapUrl: "/environments/studio_small_09_1k.hdr",
      ...options,
    };

    this.renderer = new WebGLRenderer({
      canvas: this.options.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(this.options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
this.renderer.toneMapping = 1;  // ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new Scene();
    this.faceScene = new Scene();
    this.clock = new Clock();
    this.glassesGroup = new Group();
    this.glassesGroup.name = "GlassesGroup";

    // Create face texture from image
    this.faceTexture = this.createFaceTexture(this.options.faceImage);

    // Setup cameras
    this.setupCameras();

    // Initialize post-processing passes
    this.initPostProcessing();

    this.scene.add(this.glassesGroup);
  }

  private createFaceTexture(image: HTMLImageElement): Texture {
    const texture = new Texture(image);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  private setupCameras(): void {
    const { width, height } = this.options;
    const aspect = width / height;

    // Main camera for glasses rendering (perspective)
    this.camera = new PerspectiveCamera(50, aspect, 0.01, 10);
    this.camera.position.set(0, 0, 0.5);

    // Orthographic camera for face texture (full-screen quad)
    this.faceCamera = new OrthographicCamera(
      width / -2, width / 2, height / 2, height / -2, -100, 100
    );
    this.faceCamera.position.z = 10;

    // Create face quad for rendering face texture
    const { PlaneGeometry, MeshBasicMaterial, Mesh } = require("three");
    const faceGeometry = new PlaneGeometry(width, height);
    const faceMaterial = new MeshBasicMaterial({
      map: this.faceTexture,
      transparent: true,
      depthWrite: false,
    });
    this.faceMesh = new Mesh(faceGeometry, faceMaterial);
    this.faceScene.add(this.faceMesh);
  }

  private async initPostProcessing(): Promise<void> {
const pr = this.options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);
    const resolution = new Vector2(
      this.options.width * pr,
      this.options.height * pr,
    );

    // Glasses render target (offscreen)
    this.glassesRenderTarget = new WebGLRenderTarget(resolution.x, resolution.y, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      depthBuffer: true,
      stencilBuffer: false,
    });

    // Contact shadow pass
    if (this.options.enableContactShadows) {
      this.contactShadowPass = new ContactShadowPass({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        frameMesh: this.glassesGroup,
        faceMesh: this.faceMesh,
        aoMap: null, // Will be set after model loads
        resolution,
      });
    }

    // Composite pass
    this.compositePass = new CompositePass({
      renderer: this.renderer,
      resolution,
      faceTexture: this.faceTexture,
      glassesTexture: this.glassesRenderTarget.texture,
      shadowTexture: null, // Will be set after shadow pass
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.loadAssets();
    await this.loadingPromise;
    this.initialized = true;
  }

  private async loadAssets(): Promise<void> {
    const { onProgress } = this.options;

    // Load environment map
    if (this.options.environmentMapUrl) {
      onProgress?.(0.1);
      await this.loadEnvironmentMap();
    }

    // Load glasses model
    onProgress?.(0.3);
    await this.loadGlassesModel();

    // Setup materials after model loads
    onProgress?.(0.7);
    this.setupMaterials();

    // Setup contact shadows with AO map
    onProgress?.(0.85);
    this.setupContactShadows();

    onProgress?.(1.0);
  }

  private async loadEnvironmentMap(): Promise<void> {
    return new Promise((resolve, reject) => {
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load(
        this.options.environmentMapUrl!,
        (texture) => {
          texture.mapping = 301; // EquirectangularReflectionMapping
          texture.colorSpace = SRGBColorSpace;
          
          this.pmremGenerator = new PMREMGenerator(this.renderer);
          this.pmremGenerator.compileEquirectangularShader();
          
const envMap = this.pmremGenerator.fromEquirectangular(texture).texture as CubeTexture;
           this.environmentMap = envMap;
          
          texture.dispose();
          this.pmremGenerator.dispose();
          this.pmremGenerator = null;
          
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  private async loadGlassesModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      // Setup DRACO loader for compressed models
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        this.options.glassesModel.glbUrl,
        (gltf) => {
          const model = gltf.scene;
          model.name = "GlassesModel";
          
          // Scale model to match overlay config
          this.scaleModelToFit(model);
          
          // Traverse and store references to parts
          this.processModelParts(model);
          
          this.glassesGroup.add(model);
          resolve();
        },
        (progress) => {
          if (progress.lengthComputable) {
            this.options.onProgress?.(0.3 + 0.4 * (progress.loaded / progress.total));
          }
        },
        reject
      );
    });
  }

  private scaleModelToFit(model: Object3D): void {
    const { overlayConfig, glassesModel } = this.options;
    const { glassesWidth, glassesHeight } = overlayConfig;

    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    // Calculate scale to match glasses width
    const scaleX = glassesWidth / size.x * glassesModel.scaleMultiplier;
    const scaleY = glassesHeight / size.y * glassesModel.scaleMultiplier;
    const scale = Math.min(scaleX, scaleY);

    model.scale.setScalar(scale);
    
    // Re-center
    box.setFromObject(model);
    const newCenter = box.getCenter(new Vector3());
    model.position.sub(newCenter);
  }

  private processModelParts(model: Object3D): void {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Store original material for reference
        child.userData.originalMaterial = child.material;
        
        // Identify parts by name
        const name = child.name.toLowerCase();
        if (name.includes("lens") || name.includes("glass")) {
          child.userData.partType = "lens";
        } else if (name.includes("nose") || name.includes("pad")) {
          child.userData.partType = "nosePad";
        } else if (name.includes("temple") && name.includes("tip")) {
          child.userData.partType = "templeTip";
        } else if (name.includes("hinge")) {
          child.userData.partType = "hinge";
        } else if (name.includes("temple") || name.includes("arm")) {
          child.userData.partType = "temple";
        } else {
          child.userData.partType = "frame";
        }
      }
    });
  }

  private setupMaterials(): void {
    const { glassesModel, enableSubsurface, enableChromaticAberration } = this.options;
    const lensType = glassesModel.lensType;

    let lensParams: LensMaterialParams;
    switch (lensType) {
      case "sunglass":
        lensParams = { ...SUNGLASS_LENS_PARAMS, envMap: this.environmentMap };
        break;
      case "polarized":
        lensParams = { ...SUNGLASS_LENS_PARAMS, envMap: this.environmentMap, roughness: 0.03 };
        break;
      default:
        lensParams = { ...DEFAULT_LENS_PARAMS, envMap: this.environmentMap };
    }

    if (glassesModel.lensParams) {
      lensParams = { ...lensParams, ...glassesModel.lensParams };
    }

    lensParams.enableChromaticAberration = enableChromaticAberration ?? lensParams.enableChromaticAberration;
    lensParams.enableFresnel = true;

    const lensMaterial = createLensMaterial(lensParams);
    const frameMaterial = createFrameMaterial({
      type: glassesModel.frameMaterial,
      envMapIntensity: 1.0,
    });

    this.glassesGroup.traverse((child) => {
      if (child instanceof Mesh) {
        const partType = child.userData.partType;
        
        switch (partType) {
          case "lens":
            child.material = lensMaterial;
            child.renderOrder = 1;
            break;
          case "nosePad":
            child.material = NOSE_PAD_MATERIAL;
            child.renderOrder = 0;
            break;
          case "templeTip":
            child.material = TEMPLE_TIP_MATERIAL;
            child.renderOrder = 0;
            break;
          case "hinge":
            child.material = HINGE_MATERIAL;
            child.renderOrder = 0;
            break;
          case "temple":
            child.material = frameMaterial.clone();
            child.renderOrder = 0;
            break;
          case "frame":
          default:
            child.material = frameMaterial;
            child.renderOrder = 0;
        }
        
        // Enable subsurface for skin-contact parts
        if (enableSubsurface && (partType === "nosePad" || partType === "templeTip")) {
          child.material.transmission = 0.15;
          child.material.thickness = 0.003;
          child.material.attenuationColor = new Color(0xffead0);
          child.material.attenuationDistance = 0.008;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  private setupContactShadows(): void {
    if (!this.contactShadowPass) return;

    // Find AO map from model (if baked)
    let aoMap: Texture | null = null;
    this.glassesGroup.traverse((child) => {
      if (child instanceof Mesh && child.material && (child.material as any).map) {
        // Check if there's an AO map in the material
        const mat = child.material as any;
        if (mat.aoMap) aoMap = mat.aoMap;
      }
    });

    if (aoMap) {
      const pr = this.options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);
      this.contactShadowPass = new ContactShadowPass({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        frameMesh: this.glassesGroup,
        faceMesh: this.faceMesh,
        aoMap,
        resolution: new Vector2(
          this.options.width * pr,
          this.options.height * pr
        ),
      });
    }
  }

  private updateGlassesTransform(): void {
    const { overlayConfig, faceLandmarks } = this.options;
    const { centerX, centerY, rotation, glassesWidth, glassesHeight, verticalOffset, headPose } = overlayConfig;

    // Convert normalized coordinates to world space
    const { width, height } = this.options;
    const aspect = width / height;
    
    // Normalized device coordinates (-1 to 1)
    const ndcX = (centerX / width) * 2 - 1;
    const ndcY = 1 - (centerY / height) * 2;
    
    // Convert to world space (camera at z=0.5, looking at origin)
    const worldX = ndcX * 0.5 * aspect;
    const worldY = ndcY * 0.5;
    const worldZ = 0.0;

    // Position glasses group
    this.glassesGroup.position.set(worldX, worldY + verticalOffset * 0.001, worldZ);

    // Apply rotation (roll from eye line)
    this.glassesGroup.rotation.z = rotation;

    // Apply head pose (yaw, pitch)
    if (headPose) {
      const quat = new Quaternion();
      quat.setFromEuler(new Euler(headPose.pitch, headPose.yaw, 0, "XYZ"));
      this.glassesGroup.quaternion.multiply(quat);
    }

    // Scale to match glasses dimensions
    const scale = glassesWidth / width;
    this.glassesGroup.scale.setScalar(scale * 100); // Adjust for world units
  }

  private updateCameraForFace(): void {
    // Update orthographic camera to match face texture
    const { width, height } = this.options;
    this.faceCamera.left = -width / 2;
    this.faceCamera.right = width / 2;
    this.faceCamera.top = height / 2;
    this.faceCamera.bottom = -height / 2;
    this.faceCamera.updateProjectionMatrix();
  }

  render(): RenderResult {
    if (!this.initialized) {
      throw new Error("Renderer not initialized. Call initialize() first.");
    }

    if (this.disposed) {
      throw new Error("Renderer has been disposed.");
    }

    // Update transforms
    this.updateGlassesTransform();
    this.updateCameraForFace();

    // Render face to texture (base layer)
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.faceScene, this.faceCamera);

    // Render glasses to offscreen target
    if (this.glassesRenderTarget) {
      this.renderer.setRenderTarget(this.glassesRenderTarget);
      this.renderer.clear(true, true, false);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
    }

    // Render contact shadows
    if (this.contactShadowPass) {
      this.shadowTexture = this.contactShadowPass.render();
      if (this.compositePass) {
        this.compositePass.setShadowTexture(this.shadowTexture);
      }
    }

    // Update composite pass textures
    if (this.compositePass) {
      this.compositePass.setGlassesTexture(this.glassesRenderTarget?.texture || null);
    }

    // Final composite
    const finalTexture = this.compositePass?.render() || this.faceTexture;

    // Render final result to canvas
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.faceScene, this.faceCamera); // Base face
    
    // Render composite quad
    if (this.compositePass) {
      this.compositePass.render();
    }

    return {
      canvas: this.options.canvas,
      texture: finalTexture,
      downloadBlob: async (type = "image/jpeg", quality = 0.92) => {
        return new Promise((resolve) => {
          this.options.canvas.toBlob(
            (blob) => resolve(blob!),
            type,
            quality
          );
        });
      },
    };
  }

  // Animation loop for live mode
  startAnimationLoop(): void {
    const animate = () => {
      if (this.disposed) return;
      
      this.clock.getDelta();
      this.render();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  updateFaceImage(image: HTMLImageElement): void {
    this.faceTexture.dispose();
    this.faceTexture = this.createFaceTexture(image);
    (this.faceMesh.material as any).map = this.faceTexture;
    this.faceMesh.material.needsUpdate = true;
    
    if (this.compositePass) {
      this.compositePass.setFaceTexture(this.faceTexture);
    }
  }

  updateLandmarks(landmarks: FaceLandmarks, overlayConfig: GlassesOverlayConfig): void {
    this.options.faceLandmarks = landmarks;
    this.options.overlayConfig = overlayConfig;
  }

  setEnvironmentMap(envMap: CubeTexture): void {
    this.environmentMap = envMap;
    this.updateMaterialEnvMaps();
  }

  private updateMaterialEnvMaps(): void {
    this.glassesGroup.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const mat = child.material as any;
        if (mat.uniforms && mat.uniforms.uEnvMap) {
          mat.uniforms.uEnvMap.value = this.environmentMap;
        } else if (mat.envMap !== undefined) {
          mat.envMap = this.environmentMap;
          mat.needsUpdate = true;
        }
      }
    });
  }

  setExposure(exposure: number): void {
    this.compositePass?.setExposure(exposure);
  }

  setWhiteBalance(wb: Color): void {
    this.compositePass?.setWhiteBalance(wb);
  }

  setColorGrading(enabled: boolean): void {
    this.compositePass?.setColorGrading(enabled);
  }

  setVignette(enabled: boolean, intensity = 0.15): void {
    this.compositePass?.setVignette(enabled, intensity);
  }

  setContactShadowsEnabled(enabled: boolean): void {
    this.contactShadowPass?.setEnabled(enabled);
  }

  setLightDirection(dir: [number, number, number]): void {
    this.contactShadowPass?.setLightDirection(dir);
  }

  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    
    this.renderer.setSize(width, height);
    
    const pr = this.options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);
    const resolution = new Vector2(
      width * pr,
      height * pr
    );
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.faceCamera.left = -width / 2;
    this.faceCamera.right = width / 2;
    this.faceCamera.top = height / 2;
    this.faceCamera.bottom = -height / 2;
    this.faceCamera.updateProjectionMatrix();
    
    this.faceMesh.scale.set(width / this.faceMesh.geometry.parameters.width, 
                           height / this.faceMesh.geometry.parameters.height, 1);
    
    this.glassesRenderTarget?.setSize(resolution.x, resolution.y);
    this.compositePass?.resize(resolution);
    this.contactShadowPass?.dispose();
    this.setupContactShadows();
  }

  async exportImage(width = 1024, height = 1024, type = "image/jpeg", quality = 0.92): Promise<Blob> {
    // Render at high resolution
    const originalWidth = this.options.width;
    const originalHeight = this.options.height;
    const originalPixelRatio = this.options.pixelRatio;
    
    this.resize(width, height);
    this.options.pixelRatio = 1;
    this.renderer.setPixelRatio(1);
    
    const result = this.render();
    
    // Restore original size
    this.resize(originalWidth, originalHeight);
    this.options.pixelRatio = originalPixelRatio;
    this.renderer.setPixelRatio(originalPixelRatio);
    
    return result.downloadBlob(type, quality);
  }

  dispose(): void {
    this.disposed = true;
    this.stopAnimationLoop();
    
    this.renderer.dispose();
    this.faceTexture.dispose();
    this.glassesRenderTarget?.dispose();
    this.contactShadowPass?.dispose();
    this.compositePass?.dispose();
    
    this.glassesGroup.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
  }

  // Static factory method
  static async create(options: GlassesRendererOptions): Promise<GlassesRenderer> {
    const renderer = new GlassesRenderer(options);
    await renderer.initialize();
    return renderer;
  }
}

// Helper function to load frame metadata
export async function loadFrameMeta(metaUrl: string): Promise<FrameMeta> {
  const response = await fetch(metaUrl);
  if (!response.ok) {
    throw new Error(`Failed to load frame meta: ${metaUrl}`);
  }
  return response.json();
}

// Helper to convert FaceLandmarks to GlassesRenderer options
export function createRendererOptionsFromLandmarks(
  faceImage: HTMLImageElement,
  landmarks: FaceLandmarks,
  overlayConfig: GlassesOverlayConfig,
  glassesModel: GlassesModel,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): GlassesRendererOptions {
  return {
    canvas,
    faceImage,
    faceLandmarks: landmarks,
    overlayConfig,
    glassesModel,
    width,
    height,
  };
}