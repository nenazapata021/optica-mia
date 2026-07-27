import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

interface LandmarkData {
  centerX: number;
  centerY: number;
  glassesWidth: number;
  rotation: number;
}

function parseBase64Image(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { faceImage, glassesImage, landmarks } = body as {
      faceImage: string;
      glassesImage: string;
      landmarks: LandmarkData;
    };

    if (!faceImage || !glassesImage || !landmarks) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: faceImage, glassesImage, landmarks" },
        { status: 400 },
      );
    }

    const faceBuffer = parseBase64Image(faceImage);
    const glassesBuffer = parseBase64Image(glassesImage);

    const faceMeta = await sharp(faceBuffer).metadata();
    const faceWidth = faceMeta.width || 800;
    const faceHeight = faceMeta.height || 600;

    const glassesMeta = await sharp(glassesBuffer).metadata();
    const origGlassesWidth = glassesMeta.width || 400;
    const origGlassesHeight = glassesMeta.height || 150;

    const targetWidth = Math.round(landmarks.glassesWidth * faceWidth);
    const targetHeight = Math.round(
      targetWidth * (origGlassesHeight / origGlassesWidth),
    );

    const processedGlasses = await sharp(glassesBuffer)
      .resize(targetWidth, targetHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .rotate(landmarks.rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const rotatedMeta = await sharp(processedGlasses).metadata();
    const rotatedWidth = rotatedMeta.width || targetWidth;
    const rotatedHeight = rotatedMeta.height || targetHeight;

    const centerX = Math.round(landmarks.centerX * faceWidth);
    const centerY = Math.round(landmarks.centerY * faceHeight);

    const left = Math.max(
      0,
      Math.min(
        faceWidth - rotatedWidth,
        centerX - Math.round(rotatedWidth / 2),
      ),
    );
    const top = Math.max(
      0,
      Math.min(
        faceHeight - rotatedHeight,
        centerY - Math.round(rotatedHeight / 2),
      ),
    );

    const result = await sharp(faceBuffer)
      .composite([
        {
          input: processedGlasses,
          left,
          top,
          blend: "multiply",
        },
      ])
      .jpeg({ quality: 0.92 })
      .toBuffer();

    const compositedBase64 = `data:image/jpeg;base64,${result.toString("base64")}`;

    return NextResponse.json({ compositedImage: compositedBase64 });
  } catch (error) {
    console.error("Try-on API error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 },
    );
  }
}
