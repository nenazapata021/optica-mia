/**
 * Normalización server-side de imágenes con sharp.
 * Usado en API routes como capa de validación/normalización antes de guardar en DB.
 *
 * Pipeline:
 *  1. Validar formato de entrada (JPEG/PNG/WEBP)
 *  2. Cover crop centrado + resize a outputSize×outputSize
 *  3. Validar que el resultado sea cuadrado y del tamaño correcto
 *  4. Exportar como PNG buffer
 */

import sharp from "sharp";

const DEFAULT_OUTPUT_SIZE = 1024;
const MIN_INTRINSIC_PX = 256;

export interface ServerNormalizeResult {
  buffer: Uint8Array;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: "image/png";
}

/**
 * Normaliza un buffer de imagen a un cuadrado perfecto outputSize×outputSize.
 * Acepta JPEG, PNG o WEBP como entrada; siempre produce PNG como salida.
 *
 * @param inputBuffer - Buffer raw del archivo subido
 * @param inputMimeType - MIME type del archivo original
 * @param outputSize - Tamaño de salida en px (default 1024)
 * @returns Buffer PNG cuadrado con dimensiones exactas outputSize×outputSize
 */
export async function normalizeImageBuffer(
  inputBuffer: Buffer,
  inputMimeType: string,
  outputSize: number = DEFAULT_OUTPUT_SIZE,
): Promise<ServerNormalizeResult> {
  // 1. Validar formato de entrada
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!acceptedTypes.includes(inputMimeType)) {
    throw new Error(
      `Formato no soportado: ${inputMimeType}. Usa JPG, PNG o WEBP.`
    );
  }

  // 2. Obtener metadata de la imagen
  const metadata = await sharp(inputBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("No se pudo leer las dimensiones de la imagen.");
  }

  // 3. Validar tamaño intrínseco mínimo
  if (metadata.width < MIN_INTRINSIC_PX || metadata.height < MIN_INTRINSIC_PX) {
    throw new Error(
      `La imagen es demasiado pequeña (${metadata.width}×${metadata.height}px). ` +
      `Usa una foto de al menos ${MIN_INTRINSIC_PX}×${MIN_INTRINSIC_PX} píxeles.`
    );
  }

  // 4. Cover crop centrado + resize a cuadrado
  //    sharp resize with fit: 'cover' + position: 'centre' does exactly what we need:
  //    - Covers the output dimensions
  //    - Crops from center
  //    - Maintains aspect ratio of the crop region
  const processed = await sharp(inputBuffer)
    .resize(outputSize, outputSize, {
      fit: "cover",
      kernel: sharp.kernel.lanczos3,
    })
    .png({ quality: 95 })
    .toBuffer({ resolveWithObject: true });

  const resultBuffer = processed.data;
  const resultInfo = processed.info;

  // 5. Validar resultado
  if (resultInfo.width !== outputSize || resultInfo.height !== outputSize) {
    throw new Error(
      `Error de procesamiento: resultado esperado ${outputSize}×${outputSize}, ` +
      `obtenido ${resultInfo.width}×${resultInfo.height}.`
    );
  }

  // 6. Verificar que no sea cuadrado con dimensiones incorrectas
  if (resultInfo.width !== resultInfo.height) {
    throw new Error(
      `La imagen resultante no es cuadrada (${resultInfo.width}×${resultInfo.height}).`
    );
  }

  return {
    buffer: new Uint8Array(resultBuffer),
    width: resultInfo.width,
    height: resultInfo.height,
    sizeBytes: resultBuffer.length,
    mimeType: "image/png",
  };
}
