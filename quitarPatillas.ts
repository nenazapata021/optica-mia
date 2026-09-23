import Jimp from "jimp";
import { program } from "commander";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import * as faceapi from "@vladmandic/face-api";
import { Canvas, Image, ImageData, loadImage } from "canvas";

// face-api.js necesita que le "inyectemos" las implementaciones de Canvas/Image
// de Node, ya que fue pensado originalmente para el navegador.
faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any, ImageData: ImageData as any });

type InpaintAlgorithm = "TELEA" | "NS";
type SearchROI = { x1: number; y1: number; x2: number; y2: number };

interface ProcessingOptions {
  inputDir: string;
  outputDir: string;
  searchROI?: SearchROI; // ahora es un fallback manual, ya no obligatorio
  autoROI: boolean; // si true, calcula el ROI por cara detectada
  modelsDir: string;
  roiMarginX: number; // margen extra horizontal (px) alrededor de ojo-oreja
  roiMarginY: number; // margen extra vertical (px) alrededor de ceja-ojo
  colorOverrideHSV?: [number, number, number];
  algorithm: InpaintAlgorithm;
  inpaintRadius: number;
  dilateKernel: number;
  compareDir?: string;
  verbose: boolean;
}

interface ColorRange {
  h: number;
  s: number;
  vRange: number;
  hRange: number;
  sRange: number;
}

// ---- Utils ----
const isMaskEmpty = (mask: any): boolean => {
  const count = cv.countNonZero(mask);
  return count === 0;
};

// Global cv instance - initialized in main()
let cv: any = null;

// Initialize OpenCV async
const initOpenCV = async () => {
  const cvModule = await import("@techstark/opencv-js");
  cv = cvModule;
  return cv;
};

// Carga los modelos de face-api.js (una sola vez, antes de procesar el lote)
const cargarModelosFaciales = async (modelsDir: string): Promise<void> => {
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsDir);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
};

// ---- 0. Detectar ROIs de las patillas a partir de landmarks faciales ----
// Devuelve un ROI por cada lado (izquierdo/derecho) trazado entre la esquina
// externa del ojo y el punto de la mandíbula más cercano a la oreja, que es
// justamente por donde pasa la patilla real de la montura.
const detectarROIsPatillas = async (
  inputPath: string,
  marginX: number,
  marginY: number,
  verbose: boolean
): Promise<{ left: SearchROI; right: SearchROI } | null> => {
  const image = await loadImage(inputPath);

  const detection = await faceapi
    .detectSingleFace(image as any, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (!detection) {
    if (verbose) {
      console.log("  -> No se detectó ninguna cara; se usará el ROI manual (--search-roi) si fue provisto.");
    }
    return null;
  }

  const pts = detection.landmarks.positions;

  // Índices del modelo de 68 puntos:
  // 0-16: contorno de la mandíbula (0 = cerca de oreja derecha, 16 = cerca de oreja izquierda)
  // 17-21: ceja derecha, 22-26: ceja izquierda
  // 36-41: ojo derecho, 42-47: ojo izquierdo
  const jawRightEar = pts[0];
  const jawLeftEar = pts[16];
  const rightEyeOuterCorner = pts[36];
  const leftEyeOuterCorner = pts[45];
  const rightBrow = pts.slice(17, 22);
  const leftBrow = pts.slice(22, 27);

  const minY = (points: typeof pts) => Math.min(...points.map((p) => p.y));

  // ROI derecho: franja entre la esquina del ojo derecho y la oreja derecha
  const rightTop = Math.round(minY(rightBrow) - marginY);
  const rightBottom = Math.round(Math.max(rightEyeOuterCorner.y, jawRightEar.y) + marginY);
  const right: SearchROI = {
    x1: Math.round(Math.min(jawRightEar.x, rightEyeOuterCorner.x) - marginX),
    y1: rightTop,
    x2: Math.round(Math.max(jawRightEar.x, rightEyeOuterCorner.x) + marginX),
    y2: rightBottom,
  };

  // ROI izquierdo: franja entre la esquina del ojo izquierdo y la oreja izquierda
  const leftTop = Math.round(minY(leftBrow) - marginY);
  const leftBottom = Math.round(Math.max(leftEyeOuterCorner.y, jawLeftEar.y) + marginY);
  const left: SearchROI = {
    x1: Math.round(Math.min(leftEyeOuterCorner.x, jawLeftEar.x) - marginX),
    y1: leftTop,
    x2: Math.round(Math.max(leftEyeOuterCorner.x, jawLeftEar.x) + marginX),
    y2: leftBottom,
  };

  // Clamp a los límites de la imagen
  const clamp = (roi: SearchROI): SearchROI => ({
    x1: Math.max(0, roi.x1),
    y1: Math.max(0, roi.y1),
    x2: Math.min(image.width, roi.x2),
    y2: Math.min(image.height, roi.y2),
  });

  const result = { left: clamp(left), right: clamp(right) };

  if (verbose) {
    console.log(`  -> ROI derecho: ${JSON.stringify(result.right)}`);
    console.log(`  -> ROI izquierdo: ${JSON.stringify(result.left)}`);
  }

  return result;
};

// ---- 1. Detectar color de montura (auto desde puente/lentes) ----
const detectarColorMontura = async (
  img: any,
  override?: [number, number, number],
  cvAny?: any
): Promise<ColorRange> => {
  const h = img.cols;
  const w = img.rows;

  const roiX1 = Math.round(w * 0.3);
  const roiY1 = Math.round(h * 0.15);
  const roiX2 = Math.round(w * 0.7);
  const roiY2 = Math.round(h * 0.35);

  const roiRect = new cvAny.Rect(roiX1, roiY1, roiX2 - roiX1, roiY2 - roiY1);
  const roiROI = img.roi(roiRect);

  const hsvROI = new cvAny.Mat();
  cvAny.cvtColor(roiROI, hsvROI, cvAny.COLOR_BGR2HSV);

  const hist = cvAny.calcHist(
    [hsvROI],
    [0, 1],
    null,
    [180, 256],
    [0, 180, 0, 256]
  );
  cvAny.normalize(hist, hist, 0, 1, cvAny.NORM_MINMAX);

  let maxVal = 0;
  let maxH = 90;
  let maxS = 255;

  for (let h = 0; h < 180; h++) {
    for (let s = 0; s < 256; s++) {
      const val = hist.data32F[h * hist.cols + s];
      if (val > maxVal) {
        maxVal = val;
        maxH = h;
        maxS = s;
      }
    }
  }

  const hRange = 15;
  const sRange = 40;
  const vRange = 50;

  const colorRange: ColorRange = {
    h: maxH,
    s: maxS,
    vRange: vRange,
    hRange,
    sRange,
  };

  if (override) {
    colorRange.h = override[0];
    colorRange.s = override[1];
    colorRange.vRange = override[2];
  }

  hist.delete();
  hsvROI.delete();
  roiROI.delete();

  return colorRange;
};

// ---- 2. Generar máscara de la patilla ----
// Ahora acepta un arreglo de ROIs (uno por lado) en vez de uno solo,
// para poder restringir la búsqueda a ambas patillas por separado.
const generarMascaraPatilla = async (
  img: any,
  colorRange: ColorRange,
  searchROIs: SearchROI[],
  dilateKernelSize: number,
  cvAny: any
): Promise<{ mask: any; colorUsed: [number, number, number]; hasPatillaPixels: boolean }> => {
  const hsv = new cvAny.Mat();
  cvAny.cvtColor(img, hsv, cvAny.COLOR_BGR2HSV);

  const lowerBound = new cvAny.Scalar(
    Math.max(0, colorRange.h - colorRange.hRange),
    Math.max(0, colorRange.s - colorRange.sRange),
    Math.max(0, colorRange.vRange - colorRange.vRange)
  );

  const upperBound = new cvAny.Scalar(
    Math.min(179, colorRange.h + colorRange.hRange),
    Math.min(255, colorRange.s + colorRange.sRange),
    Math.min(255, colorRange.vRange + colorRange.vRange)
  );

  const colorMask = new cvAny.Mat();
  cvAny.inRange(hsv, lowerBound, upperBound, colorMask);

  // Restringir a las regiones de búsqueda (una por cada patilla)
  const searchMask = new cvAny.Mat(
    img.rows,
    img.cols,
    cvAny.CV_8UC1,
    new cvAny.Scalar(0)
  );

  for (const sr of searchROIs) {
    const searchWidth = sr.x2 - sr.x1;
    const searchHeight = sr.y2 - sr.y1;
    if (searchWidth <= 0 || searchHeight <= 0) continue;
    searchMask.setTo(
      new cvAny.Scalar(255),
      new cvAny.Rect(sr.x1, sr.y1, searchWidth, searchHeight)
    );
  }

  const maskedColor = new cvAny.Mat();
  cvAny.bitwise_and(colorMask, colorMask, maskedColor, searchMask);

  const kernel = cvAny.getStructuringElement(
    cvAny.MORPH_RECT,
    new cvAny.Size(dilateKernelSize, dilateKernelSize),
    new cvAny.Point(-1, -1)
  );

  const closed = new cvAny.Mat();
  cvAny.morphologyEx(maskedColor, closed, cvAny.MORPH_CLOSE, kernel);

  const dilated = new cvAny.Mat();
  cvAny.dilate(closed, dilated, kernel, new cvAny.Point(-1, -1), 1);

  // Suavizar bordes de la máscara para evitar un "halo" duro tras el inpaint
  const feathered = new cvAny.Mat();
  cvAny.GaussianBlur(dilated, feathered, new cvAny.Size(5, 5), 0);
  cvAny.threshold(feathered, feathered, 60, 255, cvAny.THRESH_BINARY);

  const hasPatillaPixels = !isMaskEmpty(feathered);

  hsv.delete();
  colorMask.delete();
  maskedColor.delete();
  searchMask.delete();
  closed.delete();
  dilated.delete();

  const colorUsed: [number, number, number] = [
    colorRange.h,
    colorRange.s,
    colorRange.vRange,
  ];

  return { mask: feathered, colorUsed, hasPatillaPixels };
};

// ---- 3. Aplicar inpainting ----
const quitarPatilla = async (
  img: any,
  mask: any,
  algorithm: InpaintAlgorithm,
  inpaintRadius: number,
  cvAny: any
): Promise<any> => {
  const algorithmFlag =
    algorithm === "TELEA"
      ? cvAny.INPAINT_TELEA
      : cvAny.INPAINT_NS;

  const result = new cvAny.Mat();
  cvAny.inpaint(img, mask, inpaintRadius, result, algorithmFlag);

  mask.delete();

  return result;
};

// ---- 4. MatFromImage helper ----
const matFromImage = (jimpImg: any, cv: any): any => {
  const arr = jimpImg.bitmap.data;
  const mat = new cv.Mat(
    jimpImg.bitmap.height,
    jimpImg.bitmap.width,
    cv.CV_8UC4
  );
  mat.data.set(arr);
  return mat;
};

// ---- 5. Crear imagen de comparación (antes/después) ----
const crearComparacion = async (
  originalPath: string,
  processedPath: string,
  outputPath: string
): Promise<void> => {
  const [originalBuffer, processedBuffer] = await Promise.all([
    sharp(originalPath).resize({ width: 800 }).png().toBuffer(),
    sharp(processedPath).resize({ width: 800 }).png().toBuffer(),
  ]);

  await sharp({
    create: {
      width: 1600,
      height: 800,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: originalBuffer, left: 0, top: 0 },
      { input: processedBuffer, left: 800, top: 0 },
    ])
    .toFile(outputPath);
};

// ---- 6. Procesar una sola imagen ----
const procesarImagen = async (
  inputPath: string,
  outputPath: string,
  options: ProcessingOptions,
  cvAny: any
): Promise<void> => {
  if (options.verbose) {
    console.log(`Procesando: ${inputPath}`);
  }

  try {
    const jimpImg = await Jimp.read(inputPath);
    const mat = matFromImage(jimpImg, cvAny);

    try {
      // Calcular ROIs de búsqueda: automático por landmarks, o manual como fallback
      let searchROIs: SearchROI[] = [];

      if (options.autoROI) {
        const rois = await detectarROIsPatillas(
          inputPath,
          options.roiMarginX,
          options.roiMarginY,
          options.verbose
        );
        if (rois) {
          searchROIs = [rois.left, rois.right];
        }
      }

      if (searchROIs.length === 0) {
        if (options.searchROI) {
          searchROIs = [options.searchROI];
        } else {
          if (options.verbose) {
            console.log(`  -> Sin ROI disponible (ni cara detectada ni --search-roi manual). Copiando original.`);
          }
          const buffer = await jimpImg.getBufferAsync(Jimp.MIME_JPEG);
          fs.writeFileSync(outputPath, buffer);
          mat.delete();
          return;
        }
      }

      const colorRange = await detectarColorMontura(mat, options.colorOverrideHSV, cvAny);

      const { mask, hasPatillaPixels } = await generarMascaraPatilla(
        mat,
        colorRange,
        searchROIs,
        options.dilateKernel,
        cvAny
      );

      if (!hasPatillaPixels) {
        if (options.verbose) {
          console.log(`  -> No se detectaron píxeles de patilla. Copiando original sin cambios.`);
        }
        const buffer = await jimpImg.getBufferAsync(Jimp.MIME_JPEG);
        fs.writeFileSync(outputPath, buffer);
        mat.delete();
        return;
      }

      const result = await quitarPatilla(
        mat,
        mask,
        options.algorithm,
        options.inpaintRadius,
        cvAny
      );

      const rgbMat = new cvAny.Mat();
      cvAny.cvtColor(result, rgbMat, cvAny.COLOR_BGR2RGB);

      const bitmap = rgbMat.toBitmap() as any;
      const outJimp = new Jimp(rgbMat.cols, rgbMat.rows, bitmap.data as any);
      await outJimp.writeAsync(outputPath);

      rgbMat.delete();
      result.delete();
    } finally {
      mat.delete();
    }

    if (options.compareDir) {
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const comparisonPath = path.join(
        options.compareDir,
        `${baseName}_comparison${path.extname(inputPath)}`
      );

      try {
        await crearComparacion(inputPath, outputPath, comparisonPath);
        if (options.verbose) {
          console.log(`  -> Comparación guardada: ${comparisonPath}`);
        }
      } catch (compError) {
        if (options.verbose) {
          console.log(`  -> Error al generar comparación: ${(compError as Error).message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error procesando ${inputPath}:`, error);
    try {
      const buffer = await Jimp.read(inputPath).then((img) => img.getBufferAsync(Jimp.MIME_JPEG));
      fs.writeFileSync(outputPath, buffer);
    } catch {
      // Ignorar errores de copia de emergencia
    }
  }
};

// ---- 7. Procesar lote de imágenes ----
const procesarLote = async (options: ProcessingOptions, cvAny: any): Promise<void> => {
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  if (options.compareDir && !fs.existsSync(options.compareDir)) {
    fs.mkdirSync(options.compareDir, { recursive: true });
  }

  const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const files = fs
    .readdirSync(options.inputDir)
    .filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase()));

  if (files.length === 0) {
    console.log(`No se encontraron imágenes en ${options.inputDir}`);
    return;
  }

  if (options.verbose) {
    console.log(`Encontradas ${files.length} imágenes para procesar.`);
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(options.inputDir, file);
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const outputPath = path.join(options.outputDir, `${nameWithoutExt}${ext}`);

    await procesarImagen(inputPath, outputPath, options, cvAny);

    if (options.verbose && i < files.length - 1) {
      console.log(`  Progreso: ${i + 1}/${files.length}`);
    }
  }

  if (options.verbose) {
    console.log(`Procesamiento completado. ${files.length} imágenes procesadas.`);
  }
};

// ---- CLI (commander) ----
const main = async () => {
  await initOpenCV();

  program
    .name("quitarPatillas")
    .description(
      "Script para eliminar patillas visibles de monturas de gafas en fotos de catálogo"
    )
    .requiredOption("--input <dir>", "Directorio de imágenes de entrada")
    .requiredOption("--output <dir>", "Directorio de imágenes de salida")
    .option(
      "--models-dir <dir>",
      "Directorio con los modelos de face-api.js (tiny_face_detector + face_landmark_68)",
      "./models"
    )
    .option(
      "--no-auto-roi",
      "Desactivar la detección automática de ROI por landmarks faciales y usar solo --search-roi"
    )
    .option(
      "--search-roi <x1,y1,x2,y2>",
      "ROI manual de respaldo si no se detecta cara o si --no-auto-roi está activo",
      undefined
    )
    .option(
      "--roi-margin-x <number>",
      "Margen horizontal (px) alrededor de la franja ojo-oreja",
      "15"
    )
    .option(
      "--roi-margin-y <number>",
      "Margen vertical (px) alrededor de la franja ceja-ojo",
      "20"
    )
    .option("--color-hsv <h,s,v>", "Color HSV aproximado de la montura (override auto-detección)", undefined)
    .option("--algorithm <TELEA|NS>", "Algoritmo de inpainting", "TELEA")
    .option("--inpaint-radius <number>", "Radio de vecindad para inpainting", "5")
    .option("--dilate-kernel <number>", "Tamaño del kernel para dilatación morfológica", "5")
    .option("--compare-dir <dir>", "Directorio para guardar imágenes comparativas antes/después", undefined)
    .option("--verbose", "Mostrar información detallada en consola", false)
    .parse();

  const opts = program.opts();

  let searchROI: SearchROI | undefined;
  if (opts.searchRoi) {
    const [x1, y1, x2, y2] = opts.searchRoi.split(",").map(Number);
    searchROI = { x1, y1, x2, y2 };
  }

  let colorOverride: [number, number, number] | undefined;
  if (opts.colorHsv) {
    colorOverride = opts.colorHsv.split(",").map(Number) as [number, number, number];
  }

  const options: ProcessingOptions = {
    inputDir: opts.input,
    outputDir: opts.output,
    searchROI,
    autoROI: opts.autoRoi !== false,
    modelsDir: opts.modelsDir,
    roiMarginX: Number(opts.roiMarginX),
    roiMarginY: Number(opts.roiMarginY),
    colorOverrideHSV: colorOverride,
    algorithm: opts.algorithm as InpaintAlgorithm,
    inpaintRadius: Number(opts.inpaintRadius),
    dilateKernel: Number(opts.dilateKernel),
    compareDir: opts.compareDir,
    verbose: opts.verbose,
  };

  if (options.verbose) {
    console.log("=== Óptica Mía - Quitar Patillas ===");
    console.log(`  Input: ${options.inputDir}`);
    console.log(`  Output: ${options.outputDir}`);
    console.log(`  Auto ROI (landmarks): ${options.autoROI}`);
    console.log(`  Search ROI manual (fallback): ${options.searchROI ? JSON.stringify(options.searchROI) : "no provisto"}`);
    console.log(`  Color HSV override: ${options.colorOverrideHSV ? options.colorOverrideHSV : "auto"}`);
    console.log(`  Algorithm: ${options.algorithm}`);
    console.log(`  Inpaint radius: ${options.inpaintRadius}`);
    console.log(`  Dilate kernel: ${options.dilateKernel}`);
    if (options.compareDir) console.log(`  Compare dir: ${options.compareDir}`);
    console.log("======================================\n");
  }

  if (!fs.existsSync(options.inputDir)) {
    console.error(`Error: El directorio de entrada no existe: ${options.inputDir}`);
    process.exit(1);
  }

  if (options.autoROI) {
    if (!fs.existsSync(options.modelsDir)) {
      console.error(
        `Error: --auto-roi está activo pero no existe el directorio de modelos: ${options.modelsDir}\n` +
        `Descarga los modelos "tiny_face_detector" y "face_landmark_68" desde:\n` +
        `https://github.com/vladmandic/face-api/tree/master/model`
      );
      process.exit(1);
    }
    await cargarModelosFaciales(options.modelsDir);
  }

  await procesarLote(options, cv);
};

main();