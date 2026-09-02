"use client";

import {
  ShaderMaterial,
  Vector2,
  Color,
  Texture,
  CubeTexture,
  UniformsUtils,
} from "three";

export interface LensMaterialParams {
  envMap: CubeTexture | null;
  ior: number;
  thickness: number;
  tintColor: Color;
  tintIntensity: number;
  enableChromaticAberration: boolean;
  enableFresnel: boolean;
  roughness: number;
}

const lensVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewDir;

  uniform float uThickness;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDir = normalize(cameraPosition - vWorldPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const lensFragmentShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewDir;

  uniform samplerCube uEnvMap;
  uniform float uIor;
  uniform float uThickness;
  uniform vec3 uTintColor;
  uniform float uTintIntensity;
  uniform bool uEnableChromaticAberration;
  uniform bool uEnableFresnel;
  uniform float uRoughness;

  // Schlick's approximation for Fresnel
  float fresnelSchlick(float cosTheta, float ior) {
    float r0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
    return r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5.0);
  }

  // Chromatic aberration offset based on wavelength
  vec2 chromaticOffset(vec3 viewDir, vec3 normal, float thickness, float ior) {
    float cosTheta = dot(viewDir, normal);
    float sinTheta2 = max(0.0, 1.0 - cosTheta * cosTheta);
    float sinTheta = sqrt(sinTheta2);
    float offset = thickness * sinTheta * (1.0 / ior - 1.0);
    return viewDir.xy * offset;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);

    // Base reflection using environment map
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 envColor = textureCube(uEnvMap, reflectDir).rgb;

    // Fresnel effect
    float cosTheta = max(dot(viewDir, normal), 0.0);
    float fresnel = uEnableFresnel ? fresnelSchlick(cosTheta, uIor) : 0.04;

    // Refraction for lens thickness simulation
    vec3 refractDir = refract(-viewDir, normal, 1.0 / uIor);
    vec3 refractColor = textureCube(uEnvMap, refractDir).rgb;

    // Combine reflection and refraction based on Fresnel
    vec3 lensColor = mix(refractColor, envColor, fresnel);

    // Chromatic aberration at edges
    if (uEnableChromaticAberration) {
      vec2 offset = chromaticOffset(viewDir, normal, uThickness, uIor);
      vec3 r = textureCube(uEnvMap, reflectDir + vec3(offset * 0.02, 0.0)).rgb;
      vec3 g = textureCube(uEnvMap, reflectDir).rgb;
      vec3 b = textureCube(uEnvMap, reflectDir - vec3(offset * 0.02, 0.0)).rgb;
      lensColor = vec3(r.r, g.g, b.b);
    }

    // Apply tint (for sunglasses)
    lensColor = mix(lensColor, uTintColor, uTintIntensity);

    // Subtle roughness blur for non-perfect lenses
    if (uRoughness > 0.0) {
      // Simple approximation: blend with diffuse environment
      vec3 diffuseColor = textureCube(uEnvMap, normal).rgb;
      lensColor = mix(lensColor, diffuseColor, uRoughness * 0.3);
    }

    // Alpha: mostly transparent with edge highlight
    float alpha = 0.15 + fresnel * 0.4;
    alpha = max(alpha, 0.08); // Minimum visibility

    gl_FragColor = vec4(lensColor, alpha);
  }
`;

export function createLensMaterial(params: LensMaterialParams): ShaderMaterial {
  const uniforms = UniformsUtils.merge([
    {
      uEnvMap: { value: params.envMap },
      uIor: { value: params.ior },
      uThickness: { value: params.thickness },
      uTintColor: { value: params.tintColor },
      uTintIntensity: { value: params.tintIntensity },
      uEnableChromaticAberration: { value: params.enableChromaticAberration },
      uEnableFresnel: { value: params.enableFresnel },
      uRoughness: { value: params.roughness },
    },
  ]);

  return new ShaderMaterial({
    vertexShader: lensVertexShader,
    fragmentShader: lensFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: 2, // DoubleSide
    toneMapped: true,
  });
}

export const DEFAULT_LENS_PARAMS: LensMaterialParams = {
  envMap: null,
  ior: 1.52, // CR-39 standard
  thickness: 0.002, // 2mm in world units
  tintColor: new Color(0x000000),
  tintIntensity: 0.0,
  enableChromaticAberration: true,
  enableFresnel: true,
  roughness: 0.02,
};

export const SUNGLASS_LENS_PARAMS: LensMaterialParams = {
  ...DEFAULT_LENS_PARAMS,
  ior: 1.6,
  thickness: 0.0025,
  tintColor: new Color(0x1a1a2e),
  tintIntensity: 0.7,
  roughness: 0.05,
};

export const POLARIZED_LENS_PARAMS: LensMaterialParams = {
  ...SUNGLASS_LENS_PARAMS,
  tintIntensity: 0.6,
  roughness: 0.03,
};