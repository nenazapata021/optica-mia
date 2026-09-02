#!/usr/bin/env node
/**
 * Build script for frame assets.
 * Processes flat PNG frames into layered GLB models with PBR materials.
 * 
 * Usage: npx ts-node scripts/build-frame-assets.ts [productId]
 *        npx ts-node scripts/build-frame-assets.ts --all
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_MONTURAS = path.join(PROJECT_ROOT, "public", "monturas");
const FRAMES_DIR = path.join(PUBLIC_MONTURAS, "frames");

interface FrameMeta {
  id: string;
  name: string;
  frameMaterial: "acetate" | "metal" | "titanium" | "wood" | "carbon" | "plastic";
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
  createdAt: string;
  version: string;
}

const DEFAULT_META: Omit<FrameMeta, "id" | "name" | "createdAt" | "version"> = {
  frameMaterial: "acetate",
  lensType: "clear",
  scaleMultiplier: 1.0,
  anchorPoints: {
    leftEye: { x: -0.032, y: 0.002, z: 0.015 },
    rightEye: { x: 0.032, y: 0.002, z: 0.015 },
    noseBridge: { x: 0, y: 0.008, z: 0.02 },
    leftTemple: { x: -0.075, y: 0.005, z: 0.01 },
    rightTemple: { x: 0.075, y: 0.005, z: 0.01 },
  },
  boundingBox: { min: [-0.08, -0.03, -0.01], max: [0.08, 0.03, 0.01] },
};

const MATERIAL_DEFAULTS: Record<FrameMeta["frameMaterial"], Partial<FrameMeta>> = {
  acetate: { frameMaterial: "acetate", lensParams: { ior: 1.52, thickness: 0.002 } },
  metal: { frameMaterial: "metal", lensParams: { ior: 1.5, thickness: 0.0015 } },
  titanium: { frameMaterial: "titanium", lensParams: { ior: 1.5, thickness: 0.0015 } },
  wood: { frameMaterial: "wood", lensParams: { ior: 1.52, thickness: 0.002 } },
  carbon: { frameMaterial: "carbon", lensParams: { ior: 1.52, thickness: 0.002 } },
  plastic: { frameMaterial: "plastic", lensParams: { ior: 1.52, thickness: 0.002 } },
};

const LENS_TYPE_DEFAULTS: Record<FrameMeta["lensType"], Partial<FrameMeta["lensParams"]>> = {
  clear: { ior: 1.52, thickness: 0.002, tintIntensity: 0 },
  sunglass: { ior: 1.6, thickness: 0.0025, tintColor: 0x1a1a2e, tintIntensity: 0.7 },
  polarized: { ior: 1.6, thickness: 0.0025, tintColor: 0x1a1a2e, tintIntensity: 0.6 },
};

function detectFrameMaterial(filename: string): FrameMeta["frameMaterial"] {
  const name = filename.toLowerCase();
  if (name.includes("metal") || name.includes("dorado") || name.includes("plateado")) return "metal";
  if (name.includes("titanio")) return "titanium";
  if (name.includes("carbono") || name.includes("carbon")) return "carbon";
  if (name.includes("madera") || name.includes("wood")) return "wood";
  if (name.includes("carey") || name.includes("habana") || name.includes("translucido") || name.includes("vino")) return "acetate";
  return "plastic";
}

function detectLensType(filename: string): FrameMeta["lensType"] {
  const name = filename.toLowerCase();
  if (name.includes("sol") || name.includes("gafas-de-sol")) return "sunglass";
  if (name.includes("polarizado")) return "polarized";
  return "clear";
}

function detectScaleMultiplier(filename: string): number {
  const name = filename.toLowerCase();
  if (name.includes("oversized") || name.includes("grande")) return 1.05;
  if (name.includes("kids") || name.includes("infantil") || name.includes("niños")) return 0.9;
  if (name.includes("cateye") || name.includes("cat-eye")) return 0.95;
  if (name.includes("slim") || name.includes("minimalista")) return 0.95;
  return 1.0;
}

function generateGLBContent(meta: FrameMeta): string {
  // This is a simplified GLB generator that creates a basic frame structure
  // In production, you'd use three.js to build the model programmatically
  // or export from Blender with proper UVs and materials
  
  const { anchorPoints, boundingBox } = meta;
  
  // Create a basic GLTF JSON structure
  const gltf = {
    asset: { version: "2.0", generator: "OpticaMia Frame Builder" },
    scene: 0,
    scenes: [{ name: "Frame", nodes: [0] }],
    nodes: [
      {
        name: "FrameRoot",
        children: [1, 2, 3, 4, 5, 6],
        translation: [0, 0, 0],
      },
      {
        name: "FrontFrame",
        mesh: 0,
        translation: [0, 0, 0],
      },
      {
        name: "LeftLens",
        mesh: 1,
        translation: [anchorPoints.leftEye.x, anchorPoints.leftEye.y, anchorPoints.leftEye.z],
      },
      {
        name: "RightLens",
        mesh: 1,
        translation: [anchorPoints.rightEye.x, anchorPoints.rightEye.y, anchorPoints.rightEye.z],
      },
      {
        name: "LeftTemple",
        mesh: 2,
        translation: [anchorPoints.leftTemple.x, anchorPoints.leftTemple.y, anchorPoints.leftTemple.z],
      },
      {
        name: "RightTemple",
        mesh: 2,
        translation: [anchorPoints.rightTemple.x, anchorPoints.rightTemple.y, anchorPoints.rightTemple.z],
        rotation: [0, Math.PI, 0],
      },
      {
        name: "NosePads",
        mesh: 3,
        translation: [anchorPoints.noseBridge.x, anchorPoints.noseBridge.y, anchorPoints.noseBridge.z],
      },
    ],
    meshes: [
      {
        name: "FrontFrameMesh",
        primitives: [{
          attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
          material: 0,
        }],
      },
      {
        name: "LensMesh",
        primitives: [{
          attributes: { POSITION: 4, NORMAL: 5, TEXCOORD_0: 6 },
          material: 1,
        }],
      },
      {
        name: "TempleMesh",
        primitives: [{
          attributes: { POSITION: 8, NORMAL: 9, TEXCOORD_0: 10 },
          material: 0,
        }],
      },
      {
        name: "NosePadMesh",
        primitives: [{
          attributes: { POSITION: 12, NORMAL: 13, TEXCOORD_0: 14 },
          material: 2,
        }],
      },
    ],
    materials: [
      {
        name: "FrameMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: [0.18, 0.11, 0.08, 1.0],
          metallicFactor: 0.0,
          roughnessFactor: 0.25,
        },
        clearcoatFactor: 1.0,
        clearcoatRoughnessFactor: 0.08,
        doubleSided: true,
      },
      {
        name: "LensMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: [0.0, 0.0, 0.0, 0.1],
          metallicFactor: 0.0,
          roughnessFactor: 0.02,
        },
        transmissionFactor: 0.95,
        thicknessFactor: 0.002,
        ior: 1.52,
        doubleSided: true,
      },
      {
        name: "NosePadMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: [0.96, 0.90, 0.83, 0.7],
          metallicFactor: 0.0,
          roughnessFactor: 0.5,
        },
        transmissionFactor: 0.3,
        thicknessFactor: 0.003,
        attenuationColor: [1.0, 0.92, 0.82],
        attenuationDistance: 0.008,
        doubleSided: true,
      },
    ],
    accessors: [],
    bufferViews: [],
    buffers: [{ byteLength: 0, uri: "frame.bin" }],
  };

  // For now, return the JSON - in production this would be binary GLB
  return JSON.stringify(gltf, null, 2);
}

async function processFrame(productId: string): Promise<void> {
  const sourcePath = path.join(PUBLIC_MONTURAS, `${productId}.png`);
  const frameDir = path.join(FRAMES_DIR, productId);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source image not found: ${sourcePath}`);
    return;
  }

  // Create frame directory
  fs.mkdirSync(frameDir, { recursive: true });

  // Detect properties from filename
  const frameMaterial = detectFrameMaterial(productId);
  const lensType = detectLensType(productId);
  const scaleMultiplier = detectScaleMultiplier(productId);

  const meta: FrameMeta = {
    id: productId,
    name: productId,
    ...DEFAULT_META,
    ...MATERIAL_DEFAULTS[frameMaterial],
    frameMaterial,
    lensType,
    scaleMultiplier,
    lensParams: {
      ...DEFAULT_META.lensParams,
      ...LENS_TYPE_DEFAULTS[lensType],
      ...MATERIAL_DEFAULTS[frameMaterial]?.lensParams,
    },
    createdAt: new Date().toISOString(),
    version: "1.0.0",
  };

  // Write metadata
  const metaPath = path.join(frameDir, "frame-meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`✅ Created metadata: ${metaPath}`);

  // Copy source image as reference
  const layersDir = path.join(frameDir, "layers");
  fs.mkdirSync(layersDir, { recursive: true });
  
  const sourceCopyPath = path.join(layersDir, "source.png");
  fs.copyFileSync(sourcePath, sourceCopyPath);
  console.log(`✅ Copied source image to layers`);

  // Generate GLB (placeholder - in production use Blender/three.js)
  const glbPath = path.join(frameDir, "frame.glb");
  const glbContent = generateGLBContent(meta);
  fs.writeFileSync(glbPath.replace(".glb", ".gltf.json"), glbContent);
  console.log(`✅ Generated GLTF JSON: ${glbPath.replace(".glb", ".gltf.json")}`);

  // Create placeholder GLB (minimal valid GLB)
  const placeholderGLB = createPlaceholderGLB();
  fs.writeFileSync(glbPath, placeholderGLB);
  console.log(`✅ Created placeholder GLB: ${glbPath}`);

  // Create AO map placeholder
  const aoPath = path.join(frameDir, "ao.png");
  createPlaceholderAO(aoPath);
  console.log(`✅ Created placeholder AO map: ${aoPath}`);

  // Create thumbnail
  const thumbPath = path.join(frameDir, "thumbnail.webp");
  createPlaceholderThumbnail(thumbPath);
  console.log(`✅ Created placeholder thumbnail: ${thumbPath}`);

  console.log(`\n📦 Frame assets ready for: ${productId}`);
  console.log(`   Material: ${frameMaterial}`);
  console.log(`   Lens: ${lensType}`);
  console.log(`   Scale: ${scaleMultiplier}x`);
}

function createPlaceholderGLB(): Buffer {
  // Minimal valid GLB binary (12-byte header + JSON chunk + BIN chunk)
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
    buffers: [{ byteLength: 0 }],
  });
  
  const jsonBytes = Buffer.from(json, "utf8");
  const jsonPadded = Buffer.alloc(Math.ceil(jsonBytes.length / 4) * 4);
  jsonBytes.copy(jsonPadded);
  
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // "gltF"
  header.writeUInt32LE(2, 4); // version
  header.writeUInt32LE(12 + jsonPadded.length + 8, 8); // total length
  
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"
  
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(0, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"
  
  return Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader]);
}

function createPlaceholderAO(outputPath: string): void {
  // Create a simple 512x512 grayscale PNG as placeholder
  // In production, bake this from Blender
  const { createCanvas } = require("canvas");
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");
  
  // Radial gradient for AO
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.5, "#e0e0e0");
  gradient.addColorStop(1, "#cccccc");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Add some occlusion areas
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.ellipse(180, 256, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(332, 256, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
}

function createPlaceholderThumbnail(outputPath: string): void {
  const { createCanvas } = require("canvas");
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, 300, 300);
  
  ctx.fillStyle = "#999";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Frame Preview", 150, 150);
  
  const buffer = canvas.toBuffer("image/webp", { quality: 0.8 });
  fs.writeFileSync(outputPath, buffer);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  console.log("🔨 Optica Mía - Frame Asset Builder");
  console.log("=====================================\n");

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  npx ts-node scripts/build-frame-assets.ts [productId]
  npx ts-node scripts/build-frame-assets.ts --all
  npx ts-node scripts/build-frame-assets.ts --help

Examples:
  npx ts-node scripts/build-frame-assets.ts foto1
  npx ts-node scripts/build-frame-assets.ts --all
`);
    process.exit(0);
  }

  if (args.includes("--all")) {
    // Process all frames in public/monturas
    const files = fs.readdirSync(PUBLIC_MONTURAS)
      .filter(f => f.endsWith(".png") && !f.includes("gafas-sol"))
      .map(f => f.replace(".png", ""));
    
    console.log(`📦 Processing ${files.length} frames...\n`);
    
    for (const productId of files) {
      try {
        await processFrame(productId);
      } catch (err) {
        console.error(`❌ Failed to process ${productId}:`, err);
      }
      console.log("");
    }
    
    console.log("✅ All frames processed!");
    return;
  }

  if (args.length === 0) {
    console.error("❌ Please provide a productId or use --all");
    process.exit(1);
  }

  const productId = args[0];
  await processFrame(productId);
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});