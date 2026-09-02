"use client";

import {
  ShaderMaterial,
  UniformsUtils,
  Vector2,
  Color,
  Texture,
  HalfFloatType,
} from "three";

export interface ContactShadowParams {
  aoMap: Texture | null;
  faceOvalTexture: Texture | null;
  contactDistance: number;
  shadowColor: Color;
  shadowOpacity: number;
  lightDirection: [number, number, number];
  enableDynamicLighting: boolean;
}

const contactShadowVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
  }
`;

const contactShadowFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  uniform sampler2D uAOMap;
  uniform sampler2D uFaceOvalTexture;
  uniform float uContactDistance;
  uniform vec3 uShadowColor;
  uniform float uShadowOpacity;
  uniform vec3 uLightDirection;
  uniform bool uEnableDynamicLighting;

  // Contact mask: areas where frame is close to face
  float computeContactMask(vec2 uv) {
    float ao = texture2D(uAOMap, uv).r;
    float faceMask = texture2D(uFaceOvalTexture, uv).r;
    
    // Contact occurs where AO is high (concave areas) AND face is present
    float contact = ao * faceMask;
    
    // Threshold for contact distance
    contact = smoothstep(0.3, 0.8, contact);
    
    return contact;
  }

  void main() {
    float contactMask = computeContactMask(vUv);
    
    if (contactMask < 0.01) {
      discard;
    }

    vec3 normal = normalize(vNormal);
    float nDotL = max(dot(normal, normalize(uLightDirection)), 0.0);
    
    // Dynamic lighting: shadows are darker where light doesn't reach
    float lightingFactor = uEnableDynamicLighting ? (1.0 - nDotL * 0.5) : 1.0;
    
    // Fade shadow based on contact distance
    float distanceFade = smoothstep(uContactDistance, 0.0, vWorldPosition.z);
    
    float shadowAlpha = contactMask * uShadowOpacity * lightingFactor * distanceFade;
    
    gl_FragColor = vec4(uShadowColor, shadowAlpha);
  }
`;

export function createContactShadowMaterial(params: ContactShadowParams): ShaderMaterial {
  const uniforms = UniformsUtils.merge([
    {
      uAOMap: { value: params.aoMap },
      uFaceOvalTexture: { value: params.faceOvalTexture },
      uContactDistance: { value: params.contactDistance },
      uShadowColor: { value: params.shadowColor },
      uShadowOpacity: { value: params.shadowOpacity },
      uLightDirection: { value: new Float32Array(params.lightDirection) },
      uEnableDynamicLighting: { value: params.enableDynamicLighting },
    },
  ]);

  return new ShaderMaterial({
    vertexShader: contactShadowVertexShader,
    fragmentShader: contactShadowFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: 1, // NormalBlending
  });
}

export interface ContactShadowPassOptions {
  renderer: any; // THREE.WebGLRenderer
  scene: any; // THREE.Scene
  camera: any; // THREE.Camera
  frameMesh: any; // THREE.Mesh (the glasses frame)
  faceMesh: any; // THREE.Mesh (face proxy for occlusion)
  aoMap: Texture | null;
  resolution: Vector2;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class ContactShadowPass {
  private renderer: any;
  private scene: any;
  private camera: any;
  private frameMesh: any;
  private faceMesh: any;
  private material: ShaderMaterial;
  private renderTarget: any;
  private quadMesh: any;
  private enabled: boolean = true;

  constructor(options: ContactShadowPassOptions) {
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.camera = options.camera;
    this.frameMesh = options.frameMesh;
    this.faceMesh = options.faceMesh;

    // Create face oval texture from face mesh (baked or procedural)
    const faceOvalTexture = this.createFaceOvalTexture(options.faceMesh);

    this.material = createContactShadowMaterial({
      aoMap: options.aoMap,
      faceOvalTexture,
      contactDistance: 0.008,
      shadowColor: new Color(0x0a0806),
      shadowOpacity: 0.35,
      lightDirection: [0.3, 0.8, 0.5],
      enableDynamicLighting: true,
    });

    // Offscreen render target for shadow pass
    this.renderTarget = new this.renderer.constructor.prototype.constructor.WebGLRenderTarget(
      options.resolution.x,
      options.resolution.y,
      {
        type: HalfFloatType,
        format: 1023, // RGBAFormat
        depthBuffer: true,
        stencilBuffer: false,
      }
    );

    // Full-screen quad for composition
    const { PlaneGeometry, Mesh } = require("three");
    const geometry = new PlaneGeometry(2, 2);
    this.quadMesh = new Mesh(geometry, this.material);
    this.quadMesh.frustumCulled = false;
  }

  private createFaceOvalTexture(faceMesh: any): Texture {
    // In production, this would be a baked texture from the face mesh
    // For now, create a procedural circular gradient
    const { DataTexture, RGBAFormat, FloatType, LinearFilter, ClampToEdgeWrapping } = require("three");
    const size = 512;
    const data = new Float32Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const ux = (x + 0.5) / size;
        const uy = (y + 0.5) / size;
        const dx = ux - 0.5;
        const dy = uy - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy) * 2.0;
        
        // Oval mask
        const oval = 1.0 - smoothstep(0.35, 0.5, dist);
        const idx = (y * size + x) * 4;
        data[idx] = oval;
        data[idx + 1] = oval;
        data[idx + 2] = oval;
        data[idx + 3] = oval;
      }
    }
    
    const texture = new DataTexture(data, size, size, RGBAFormat, FloatType);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
    
    return texture;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setLightDirection(dir: [number, number, number]) {
    this.material.uniforms.uLightDirection.value = new Float32Array(dir);
  }

  setContactDistance(dist: number) {
    this.material.uniforms.uContactDistance.value = dist;
  }

  setShadowOpacity(opacity: number) {
    this.material.uniforms.uShadowOpacity.value = opacity;
  }

  render(): any {
    if (!this.enabled) return null;

    // Render frame mesh with shadow material to render target
    const originalMaterial = this.frameMesh.material;
    this.frameMesh.material = this.material;

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.frameMesh, this.camera);
    this.renderer.setRenderTarget(null);

    this.frameMesh.material = originalMaterial;

    return this.renderTarget.texture;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    this.quadMesh.geometry.dispose();
  }
}

export const DEFAULT_CONTACT_SHADOW_PARAMS: ContactShadowParams = {
  aoMap: null,
  faceOvalTexture: null,
  contactDistance: 0.008,
  shadowColor: new Color(0x0a0806),
  shadowOpacity: 0.35,
  lightDirection: [0.3, 0.8, 0.5],
  enableDynamicLighting: true,
};