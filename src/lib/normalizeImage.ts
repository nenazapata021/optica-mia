/**
 * Normalización client-side de imágenes a cuadrado 1024×1024.
 * Usa Canvas API — funciona en cualquier navegador moderno.
 *
 * Pipeline:
 *  1. Validar formato y tamaño intrínseco (mín 256×256)
 *  2. Cover crop centrado (centro de imagen)
 *  3. Resize a outputSize×outputSize con imageSmoothing high quality
 *  4. Exportar como PNG blob
 */

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MIN_INTRINSIC_PX = 256;
const DEFAULT_OUTPUT_SIZE = 1024;

export interface NormalizeResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Carga un File como HTMLImageElement (revoca object URL al cargar).
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

/**
 * Normaliza un archivo de imagen a un cuadrado perfecto.
 *
 * @param file - Archivo JPEG/PNG/WEBP
 * @param outputSize - Tamaño de salida en px (default 1024)
 * @param centerXY - Centro normalizado del recorte (0-1). Default: centro de imagen (0.5, 0.5).
 *                  Pasar coordenadas del rostro para centrar el crop en el rostro.
 * @returns Blob PNG cuadrado con dimensiones exactas outputSize×outputSize
 */
export async function normalizeImage(
  file: File,
  outputSize: number = DEFAULT_OUTPUT_SIZE,
  centerXY?: { x: number; y: number },
): Promise<NormalizeResult> {
  // 1. Validar formato
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  // 2. Cargar imagen
  const img = await loadImageFromFile(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // 3. Validar tamaño intrínseco mínimo
  if (srcW < MIN_INTRINSIC_PX || srcH < MIN_INTRINSIC_PX) {
    throw new Error(
      `La imagen es demasiado pequeña (${srcW}×${srcH}px). Usa una foto de al menos ${MIN_INTRINSIC_PX}×${MIN_INTRINSIC_PX} píxeles.`
    );
  }

  // 4. Calcular cover crop centrado
  const cx = centerXY?.x ?? 0.5;
  const cy = centerXY?.y ?? 0.5;

  // Cover crop: el lado más corto de la fuente define el tamaño del crop
  const aspect = srcW / srcH;
  let cropW: number;
  let cropH: number;

  if (aspect > 1) {
    // Imagen apaisada: crop cuadrado por altura
    cropH = srcH;
    cropW = srcH;
  } else if (aspect < 1) {
    // Imagen vertical: crop cuadrado por ancho
    cropW = srcW;
    cropH = srcW;
  } else {
    // Ya es cuadrada
    cropW = srcW;
    cropH = srcH;
  }

  // Centrar el crop en (cx, cy) con clamp a bordes
  let sx = Math.round(cx * srcW - cropW / 2);
  let sy = Math.round(cy * srcH - cropH / 2);

  sx = Math.max(0, Math.min(sx, srcW - cropW));
  sy = Math.max(0, Math.min(sy, srcH - cropH));

  // Guard contra dimensiones degeneradas
  const safeCropW = Math.max(1, Math.min(cropW, srcW - sx));
  const safeCropH = Math.max(1, Math.min(cropH, srcH - sy));

  // 5. Canvas: resize a outputSize×outputSize
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el procesador de imagen.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    sx,
    sy,
    safeCropW,
    safeCropH,
    0,
    0,
    outputSize,
    outputSize,
  );

  // 6. Exportar como PNG
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("No se pudo generar la imagen procesada."));
      },
      "image/png",
    );
  });

  return {
    blob,
    width: outputSize,
    height: outputSize,
    sizeBytes: blob.size,
  };
}

/**
 * Versión que acepta un HTMLImageElement ya cargado (para flujos donde
 * la imagen ya está en memoria, e.g. después de face detection).
 */
export async function normalizeImageFromElement(
  img: HTMLImageElement,
  outputSize: number = DEFAULT_OUTPUT_SIZE,
  centerXY?: { x: number; y: number },
): Promise<NormalizeResult> {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  if (srcW < MIN_INTRINSIC_PX || srcH < MIN_INTRINSIC_PX) {
    throw new Error(
      `La imagen es demasiado pequeña (${srcW}×${srcH}px). Usa una foto de al menos ${MIN_INTRINSIC_PX}×${MIN_INTRINSIC_PX} píxeles.`
    );
  }

  const cx = centerXY?.x ?? 0.5;
  const cy = centerXY?.y ?? 0.5;

  const aspect = srcW / srcH;
  let cropW: number;
  let cropH: number;

  if (aspect > 1) {
    cropH = srcH;
    cropW = srcH;
  } else if (aspect < 1) {
    cropW = srcW;
    cropH = srcW;
  } else {
    cropW = srcW;
    cropH = srcH;
  }

  let sx = Math.round(cx * srcW - cropW / 2);
  let sy = Math.round(cy * srcH - cropH / 2);

  sx = Math.max(0, Math.min(sx, srcW - cropW));
  sy = Math.max(0, Math.min(sy, srcH - cropH));

  const safeCropW = Math.max(1, Math.min(cropW, srcW - sx));
  const safeCropH = Math.max(1, Math.min(cropH, srcH - sy));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el procesador de imagen.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    sx,
    sy,
    safeCropW,
    safeCropH,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("No se pudo generar la imagen procesada."));
      },
      "image/png",
    );
  });

  return {
    blob,
    width: outputSize,
    height: outputSize,
    sizeBytes: blob.size,
  };
}
