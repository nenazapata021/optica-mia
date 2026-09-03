import Jimp from "jimp";
import { createRequire } from "module";
import { program } from "commander";
import fs from "fs";
import path from "path";
import sharp from "sharp";

type InpaintAlgorithm = "TELEA" | "NS";
type SearchROI = { x1: number; y1: number; x2: number; y2: number };

interface ProcessingOptions {
  inputDir: string;
  outputDir: string;
  searchROI: SearchROI;
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
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

// ---- 1. Detectar color de montura (auto desde puente/lentes) ----
const detectarColorMontura = async (
  img: any,
  override?: [number, number, number],
  cvAny?: any
): Promise<ColorRange> => {
  const h = img.cols;
  const w = img.rows;

  // ROI por defecto: zona central superior (puente entre lentes)
  // ~40% ancho central, 20% alto superior
  const roiX1 = Math.round(w * 0.3);
  const roiY1 = Math.round(h * 0.15);
  const roiX2 = Math.round(w * 0.7);
  const roiY2 = Math.round(h * 0.35);

  const roi = new cvAny.Mat(img.rows, img.cols, cvAny.CV_8UC4);
  img.copyTo(roi);

  const roiHeight = roiY2 - roiY1;
  const roiWidth = roiX2 - roiX1;
  const roiMask = new cvAny.Mat(roiHeight, roiWidth, cvAny.CV_8UC1, new cvAny.Scalar(0));
  const roiOffset = new cvAny.Point(roiX1, roiY1);
  const roiROI = new cvAny.Mat();
  roi(roiROI, roiMask, roiOffset);

  // Convertir ROI a HSV
  const hsvROI = new cvAny.Mat();
  cvAny.cvtColor(roiROI, hsvROI, cvAny.COLOR_BGR2HSV);

  // Calcular histograma 2D (H, S)
  const hist = cvAny.calcHist(
    [hsvROI],
    [0, 1],
    null,
    [180, 256],
    [0, 180, 0, 256]
  );
  cvAny.normalize(hist, hist, 0, 1, cvAny.NORM_MINMAX);

  // Encontrar el pico dominante
  let maxVal = 0;
  let maxH = 90;
  let maxS = 255;

  for (let h = 0; h < 180; h++) {
    for (let s = 0; s < 256; s++) {
      const val = hist.at<number>(h, s);
      if (val > maxVal) {
        maxVal = val;
        maxH = h;
        maxS = s;
      }
    }
  }

  // Ranges tolerantes
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

  // Aplicar override por CLI si se proporciona
  if (override) {
    colorRange.h = override[0];
    colorRange.s = override[1];
    colorRange.vRange = override[2];
  }

  // Cleanup
  hist.delete();
  hsvROI.delete();
  roiROI.delete();
  roiMask.delete();
  roi.delete();

  return colorRange;
};

// ---- 2. Generar máscara de la patilla ----
const generarMascaraPatilla = async (
  img: any,
  colorRange: ColorRange,
  searchROI: SearchROI,
  dilateKernelSize: number,
  cvAny: any
): Promise<{ mask: any; colorUsed: [number, number, number]; hasPatillaPixels: boolean }> => {
  // Crear máscara base basada en color HSV
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

  // Restringir a región de búsqueda (searchROI absoluta)
  const searchMask = new cvAny.Mat(
    img.rows,
    img.cols,
    cvAny.CV_8UC1,
    new cvAny.Scalar(0)
  );

  const sr = searchROI;
  const searchWidth = sr.x2 - sr.x1;
  const searchHeight = sr.y2 - sr.y1;
  searchMask.setTo(new cvAny.Scalar(255), new cvAny.Rect(sr.x1, sr.y1, searchWidth, searchHeight));

  // Aplicar máscara de búsqueda sobre el color mask
  const maskedColor = new cvAny.Mat();
  cvAny.bitwise_and(colorMask, colorMask, maskedColor, searchMask);

  // Operaciones morfológicas: close para unir fragmentos, dilate para cubrir bordes
  const kernel = cvAny.getStructuringElement(
    cvAny.MORPH_RECT,
    new cvAny.Size(dilateKernelSize, dilateKernelSize),
    new cvAny.Point(-1, -1)
  );

  const closed = new cvAny.Mat();
  cvAny.morphologyEx(maskedColor, closed, cvAny.MORPH_CLOSE, kernel);

  const dilated = new cvAny.Mat();
  cvAny.dilate(closed, dilated, kernel, new cvAny.Point(-1, -1), 1);

  // Verificar si hay píxeles de patilla en la máscara
  const hasPatillaPixels = !isMaskEmpty(dilated);

  // Cleanup temporales
  hsv.delete();
  colorMask.delete();
  maskedColor.delete();
  searchMask.delete();
  closed.delete();

  const colorUsed: [number, number, number] = [
    colorRange.h,
    colorRange.s,
    colorRange.vRange,
  ];

  return { mask: dilated, colorUsed, hasPatillaPixels };
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

  // Cleanup mask
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
    sharp(originalPath)
      .resize({ width: 800 })
      .png()
      .toBuffer(),
    sharp(processedPath)
      .resize({ width: 800 })
      .png()
      .toBuffer(),
  ]);

  const combined = await sharp({
    create: {
      width: 1600,
      height: 800,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: originalBuffer, left: 0 },
      { input: processedBuffer, left: 800 },
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
    // Leer imagen con Jimp
    const jimpImg = await Jimp.read(inputPath);

    // Convertir a OpenCV Mat
    const mat = matFromImage(jimpImg);

    try {
      // Detectar color de montura (automático, con posible override CLI)
      const colorRange = await detectarColorMontura(mat, options.colorOverrideHSV, cvAny);

      // Generar máscara de la patilla
      const { mask, hasPatillaPixels } = await generarMascaraPatilla(
        mat,
        colorRange,
        options.searchROI,
        options.dilateKernel,
        cvAny
      );

      if (!hasPatillaPixels) {
        if (options.verbose) {
          console.log(`  -> No se detectaron píxeles de patilla. Copiando original sin cambios.`);
        }
        // Copiar original sin cambios
        const buffer = await jimpImg.getBufferAsync(Jimp.MIME_JPEG);
        fs.writeFileSync(outputPath, buffer);
        mat.delete();
        return;
      }

      // Aplicar inpainting
      const result = await quitarPatilla(
        mat,
        mask,
        options.algorithm,
        options.inpaintRadius,
        cvAny
      );

      // Guardar resultado - convertir de BGR a RGB
      const resultMat = result;
      const rgbMat = new cvAny.Mat();
      cvAny.cvtColor(resultMat, rgbMat, cvAny.COLOR_BGR2RGB);

      // Convertir a Jimp y guardar
      const bitmap = rgbMat.toBitmap() as any;
      const outJimp = new Jimp(
        rgbMat.cols,
        rgbMat.rows,
        bitmap.data as any
      );
      await outJimp.writeAsync(outputPath);

      // Cleanup
      resultMat.delete();
      rgbMat.delete();
      result.delete();

    } finally {
      mat.delete();
    }

    // Generar imagen de comparación lado a lado si se solicita
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
    // Copiar original en caso de error
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
  // Asegurar que directorios de salida existen
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  if (options.compareDir && !fs.existsSync(options.compareDir)) {
    fs.mkdirSync(options.compareDir, { recursive: true });
  }

  // Leer todas las imágenes del directorio de entrada
  const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const files = fs
    .readdirSync(options.inputDir)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return supportedExtensions.includes(ext);
    });

  if (files.length === 0) {
    console.log(`No se encontraron imágenes en ${options.inputDir}`);
    return;
  }

  if (options.verbose) {
    console.log(`Encontradas ${files.length} imágenes para procesar.`);
  }

  // Procesar cada archivo
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(options.inputDir, file);
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const outputFileName = `${nameWithoutExt}${ext}`;
    const outputPath = path.join(options.outputDir, outputFileName);

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
  // Initialize OpenCV first
  await initOpenCV();

  program
    .name("quitarPatillas")
    .description(
      "Script para eliminar patillas visibles de monturas de gafas en fotos de catálogo"
    )
    .requiredOption(
      "--input <dir>",
      "Directorio de imágenes de entrada"
    )
    .requiredOption(
      "--output <dir>",
      "Directorio de imágenes de salida"
    )
    .option(
      "--search-roi <x1,y1,x2,y2>",
      "Región de búsqueda absoluta (x1,y1,x2,y2) para la patilla",
      "0,0,1200,400"
    )
    .option(
      "--color-hsv <h,s,v>",
      "Color HSV aproximado de la montura (override auto-detección)",
      undefined
    )
    .option(
      "--algorithm <TELEA|NS>",
      "Algoritmo de inpainting",
      "TELEA"
    )
    .option(
      "--inpaint-radius <number>",
      "Radio de vecindad para inpainting",
      "3"
    )
    .option(
      "--dilate-kernel <number>",
      "Tamaño del kernel para dilatación morfológica",
      "5"
    )
    .option(
      "--compare-dir <dir>",
      "Directorio para guardar imágenes comparativas antes/después",
      undefined
    )
    .option(
      "--verbose",
      "Mostrar información detallada en consola",
      false
    )
    .parse();

  const opts = program.opts();

  // Parsear search-roi
  const [x1, y1, x2, y2] = opts.searchROI.split(",").map(Number);
  const searchROI: SearchROI = { x1, y1, x2, y2 };

  // Parsear color HSV si se proporciona
  let colorOverride: [number, number, number] | undefined;
  if (opts.colorHSV) {
    colorOverride = opts.colorHSV.split(",").map(Number) as [number, number, number];
  }

  const options: ProcessingOptions = {
    inputDir: opts.input,
    outputDir: opts.output,
    searchROI,
    colorOverrideHSV: colorOverride,
    algorithm: opts.algorithm as InpaintAlgorithm,
    inpaintRadius: Number(opts.inpaintRadius),
    dilateKernel: Number(opts.dilateKernel),
    compareDir: opts.compareDir,
    verbose: opts.verbose,
  };

  if (options.verbose) {
    console.log("=== Óptica Mía - Quitar Patillas ===");
    console.log("Opciones de configuración:");
    console.log(`  Input: ${options.inputDir}`);
    console.log(`  Output: ${options.outputDir}`);
    console.log(`  Search ROI: ${JSON.stringify(options.searchROI)}`);
    console.log(`  Color HSV override: ${options.colorOverrideHSV ? options.colorOverrideHSV : "auto"}`);
    console.log(`  Algorithm: ${options.algorithm}`);
    console.log(`  Inpaint radius: ${options.inpaintRadius}`);
    console.log(`  Dilate kernel: ${options.dilateKernel}`);
    if (options.compareDir) {
      console.log(`  Compare dir: ${options.compareDir}`);
    }
    console.log("======================================\n");
  }

  // Verificar que el directorio de entrada existe
  if (!fs.existsSync(options.inputDir)) {
    console.error(`Error: El directorio de entrada no existe: ${options.inputDir}`);
    process.exit(1);
  }

  // Ejecutar procesamiento por lotes
  await procesarLote(options, cv);
};

main();