"use client";

import {
  MeshPhysicalMaterial,
  Color,
  Texture,
  DoubleSide,
} from "three";

export type FrameMaterialType = "acetate" | "metal" | "titanium" | "wood" | "carbon" | "plastic";

export interface FrameMaterialPreset {
  name: FrameMaterialType;
  baseColor: Color;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  attenuationColor: Color;
  attenuationDistance: number;
  anisotropic: number;
  anisotropyRotation: number;
  sheen: number;
  sheenRoughness: number;
  iridescence: number;
  iridescenceIOR: number;
  iridescenceThicknessRange: [number, number];
}

export const FRAME_MATERIAL_PRESETS: Record<FrameMaterialType, FrameMaterialPreset> = {
  acetate: {
    name: "acetate",
    baseColor: new Color(0x2d1b15), // Dark tortoise base
    metalness: 0.0,
    roughness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.05,
    thickness: 0.004,
    attenuationColor: new Color(0x4a2c1a),
    attenuationDistance: 0.01,
    anisotropic: 0.0,
    anisotropyRotation: 0.0,
    sheen: 0.15,
    sheenRoughness: 0.3,
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
  },
  metal: {
    name: "metal",
    baseColor: new Color(0xc0c0c0), // Silver/chrome
    metalness: 1.0,
    roughness: 0.12,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    transmission: 0.0,
    thickness: 0.0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 0.0,
    anisotropic: 0.85,
    anisotropyRotation: 0.0,
    sheen: 0.0,
    sheenRoughness: 0.0,
    iridescence: 0.02,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [200, 500],
  },
  titanium: {
    name: "titanium",
    baseColor: new Color(0x8a8a8d), // Titanium gray
    metalness: 0.95,
    roughness: 0.22,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    transmission: 0.0,
    thickness: 0.0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 0.0,
    anisotropic: 0.6,
    anisotropyRotation: 0.25,
    sheen: 0.05,
    sheenRoughness: 0.4,
    iridescence: 0.05,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [150, 350],
  },
  wood: {
    name: "wood",
    baseColor: new Color(0x5d3a1a),
    metalness: 0.0,
    roughness: 0.65,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    transmission: 0.0,
    thickness: 0.0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 0.0,
    anisotropic: 0.15,
    anisotropyRotation: 0.0,
    sheen: 0.25,
    sheenRoughness: 0.5,
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
  },
  carbon: {
    name: "carbon",
    baseColor: new Color(0x1a1a1a),
    metalness: 0.15,
    roughness: 0.35,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    transmission: 0.0,
    thickness: 0.0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 0.0,
    anisotropic: 0.9,
    anisotropyRotation: 0.5,
    sheen: 0.05,
    sheenRoughness: 0.2,
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
  },
  plastic: {
    name: "plastic",
    baseColor: new Color(0x1a1a1a),
    metalness: 0.0,
    roughness: 0.35,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    transmission: 0.0,
    thickness: 0.0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 0.0,
    anisotropic: 0.0,
    anisotropyRotation: 0.0,
    sheen: 0.1,
    sheenRoughness: 0.4,
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
  },
};

export interface FrameMaterialOptions {
  type: FrameMaterialType;
  baseColor?: Color;
  customParams?: Partial<FrameMaterialPreset>;
  envMapIntensity?: number;
}

export function createFrameMaterial(options: FrameMaterialOptions): MeshPhysicalMaterial {
  const preset = { ...FRAME_MATERIAL_PRESETS[options.type] };
  
  if (options.baseColor) {
    preset.baseColor = options.baseColor;
  }
  
  if (options.customParams) {
    Object.assign(preset, options.customParams);
  }

  const material = new MeshPhysicalMaterial({
    color: preset.baseColor,
    metalness: preset.metalness,
    roughness: preset.roughness,
    clearcoat: preset.clearcoat,
    clearcoatRoughness: preset.clearcoatRoughness,
    transmission: preset.transmission,
    thickness: preset.thickness,
    attenuationColor: preset.attenuationColor,
    attenuationDistance: preset.attenuationDistance,
    anisotropy: preset.anisotropic,
    anisotropyRotation: preset.anisotropyRotation,
    sheen: preset.sheen,
    sheenRoughness: preset.sheenRoughness,
    iridescence: preset.iridescence,
    iridescenceIOR: preset.iridescenceIOR,
    iridescenceThicknessRange: preset.iridescenceThicknessRange,
    envMapIntensity: options.envMapIntensity ?? 1.0,
    transparent: preset.transmission > 0,
    side: DoubleSide,
    flatShading: false,
  });

  return material;
}

export function createFrameMaterialFromColor(
  type: FrameMaterialType,
  color: Color,
  envMapIntensity = 1.0
): MeshPhysicalMaterial {
  return createFrameMaterial({
    type,
    baseColor: color,
    envMapIntensity,
  });
}

export const NOSE_PAD_MATERIAL = createFrameMaterial({
  type: "plastic",
  baseColor: new Color(0xf5e6d3), // Silicone-like translucent
  customParams: {
    transmission: 0.3,
    thickness: 0.002,
    attenuationColor: new Color(0xffead0),
    attenuationDistance: 0.005,
    roughness: 0.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  },
});

export const TEMPLE_TIP_MATERIAL = createFrameMaterial({
  type: "plastic",
  baseColor: new Color(0x1a1a1a),
  customParams: {
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
  },
});

export const HINGE_MATERIAL = createFrameMaterial({
  type: "metal",
  baseColor: new Color(0xb8b8b8),
  customParams: {
    roughness: 0.15,
    anisotropic: 0.9,
  },
});