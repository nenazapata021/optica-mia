"use client";

import {
  ShaderMaterial,
  UniformsUtils,
  Texture,
  Vector2,
  Color,
  HalfFloatType,
  RGBAFormat,
  LinearFilter,
  ClampToEdgeWrapping,
  WebGLRenderTarget,
  Scene,
  Camera,
  Mesh,
  PlaneGeometry,
  WebGLRenderer,
  DataTexture,
  FloatType,
} from "three";

export interface CompositePassParams {
  faceTexture: Texture | null;
  glassesTexture: Texture | null;
  shadowTexture: Texture | null;
  exposure: number;
  whiteBalance: Color;
  enableColorGrading: boolean;
  enableVignette: boolean;
  vignetteIntensity: number;
}

const compositeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const compositeFragmentShader = `
  varying vec2 vUv;

  uniform sampler2D uFaceTexture;
  uniform sampler2D uGlassesTexture;
  uniform sampler2D uShadowTexture;
  uniform float uExposure;
  uniform vec3 uWhiteBalance;
  uniform bool uEnableColorGrading;
  uniform bool uEnableVignette;
  uniform float uVignetteIntensity;

  // Filmic tone mapping (ACES approximation)
  vec3 acesFilmic(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  // sRGB to linear
  vec3 srgbToLinear(vec3 c) {
    return pow(max(c, 0.0), vec3(2.2));
  }

  // Linear to sRGB
  vec3 linearToSrgb(vec3 c) {
    return pow(max(c, 0.0), vec3(1.0 / 2.2));
  }

  // White balance adjustment
  vec3 applyWhiteBalance(vec3 color, vec3 wb) {
    return color * wb;
  }

  // Vignette effect
  float vignette(vec2 uv, float intensity) {
    vec2 center = uv - 0.5;
    float dist = length(center) * 1.414;
    return 1.0 - smoothstep(0.5, 1.0, dist) * intensity;
  }

  void main() {
    vec4 faceColor = texture2D(uFaceTexture, vUv);
    vec4 glassesColor = texture2D(uGlassesTexture, vUv);
    vec4 shadowColor = texture2D(uShadowTexture, vUv);

    // Convert to linear space for compositing
    vec3 faceLinear = srgbToLinear(faceColor.rgb);
    vec3 glassesLinear = srgbToLinear(glassesColor.rgb);
    vec3 shadowLinear = srgbToLinear(shadowColor.rgb);

    // Alpha-premultiplied compositing
    // Result = glasses * glassesAlpha + face * (1 - glassesAlpha)
    float glassesAlpha = glassesColor.a;
    
    // Apply contact shadows first (multiply on face)
    vec3 faceWithShadows = faceLinear * (1.0 - shadowLinear * shadowColor.a * 0.8);
    
    // Composite glasses over face with shadows
    vec3 compositeLinear = mix(faceWithShadows, glassesLinear, glassesAlpha);
    
    // Add glasses emission (for lens reflections)
    compositeLinear += glassesLinear * glassesAlpha * 0.1;

    // Exposure adjustment
    compositeLinear *= uExposure;

    // White balance
    if (uEnableColorGrading) {
      compositeLinear = applyWhiteBalance(compositeLinear, uWhiteBalance);
    }

    // Tone mapping
    compositeLinear = acesFilmic(compositeLinear);

    // Vignette
    float vig = uEnableVignette ? vignette(vUv, uVignetteIntensity) : 1.0;
    compositeLinear *= vig;

    // Back to sRGB
    vec3 finalColor = linearToSrgb(compositeLinear);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function createCompositeMaterial(params: CompositePassParams): ShaderMaterial {
  const uniforms = UniformsUtils.merge([
    {
      uFaceTexture: { value: params.faceTexture },
      uGlassesTexture: { value: params.glassesTexture },
      uShadowTexture: { value: params.shadowTexture },
      uExposure: { value: params.exposure },
      uWhiteBalance: { value: params.whiteBalance },
      uEnableColorGrading: { value: params.enableColorGrading },
      uEnableVignette: { value: params.enableVignette },
      uVignetteIntensity: { value: params.vignetteIntensity },
    },
  ]);

  return new ShaderMaterial({
    vertexShader: compositeVertexShader,
    fragmentShader: compositeFragmentShader,
    uniforms,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });
}

export interface CompositePassOptions {
  renderer: WebGLRenderer;
  resolution: Vector2;
  faceTexture: Texture | null;
  glassesTexture: Texture | null;
  shadowTexture: Texture | null;
}

export class CompositePass {
  private renderer: WebGLRenderer;
  private material: ShaderMaterial;
  private renderTarget: WebGLRenderTarget;
  private quadScene: Scene;
  private quadMesh: Mesh;
  private camera: Camera;
  private enabled: boolean = true;

  constructor(options: CompositePassOptions) {
    this.renderer = options.renderer;

    this.material = createCompositeMaterial({
      faceTexture: options.faceTexture,
      glassesTexture: options.glassesTexture,
      shadowTexture: options.shadowTexture,
      exposure: 1.0,
      whiteBalance: new Color(1.0, 1.0, 1.0),
      enableColorGrading: true,
      enableVignette: false,
      vignetteIntensity: 0.15,
    });

    this.renderTarget = new WebGLRenderTarget(
      options.resolution.x,
      options.resolution.y,
      {
        type: HalfFloatType,
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      }
    );

    this.quadScene = new Scene();
    const geometry = new PlaneGeometry(2, 2);
    this.quadMesh = new Mesh(geometry, this.material);
    this.quadMesh.frustumCulled = false;
    this.quadScene.add(this.quadMesh);

    // Orthographic camera for full-screen quad
    const { OrthographicCamera } = require("three");
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setFaceTexture(texture: Texture | null) {
    this.material.uniforms.uFaceTexture.value = texture;
  }

  setGlassesTexture(texture: Texture | null) {
    this.material.uniforms.uGlassesTexture.value = texture;
  }

  setShadowTexture(texture: Texture | null) {
    this.material.uniforms.uShadowTexture.value = texture;
  }

  setExposure(exposure: number) {
    this.material.uniforms.uExposure.value = exposure;
  }

  setWhiteBalance(wb: Color) {
    this.material.uniforms.uWhiteBalance.value = wb;
  }

  setColorGrading(enabled: boolean) {
    this.material.uniforms.uEnableColorGrading.value = enabled;
  }

  setVignette(enabled: boolean, intensity = 0.15) {
    this.material.uniforms.uEnableVignette.value = enabled;
    this.material.uniforms.uVignetteIntensity.value = intensity;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  render(): Texture {
    if (!this.enabled) {
      return this.material.uniforms.uFaceTexture.value;
    }

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.quadScene, this.camera);
    this.renderer.setRenderTarget(null);

    return this.renderTarget.texture;
  }

  getOutputTexture(): Texture {
    return this.renderTarget.texture;
  }

  resize(resolution: Vector2) {
    this.renderTarget.setSize(resolution.x, resolution.y);
    this.material.uniforms.uResolution.value = resolution;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    this.quadMesh.geometry.dispose();
  }
}

export const DEFAULT_COMPOSITE_PARAMS: CompositePassParams = {
  faceTexture: null,
  glassesTexture: null,
  shadowTexture: null,
  exposure: 1.0,
  whiteBalance: new Color(1.0, 1.0, 1.0),
  enableColorGrading: true,
  enableVignette: false,
  vignetteIntensity: 0.15,
};