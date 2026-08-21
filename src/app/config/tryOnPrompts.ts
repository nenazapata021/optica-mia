/**
 * Prompt maestro para la generación fotorrealista del probador virtual.
 * Codifica los requisitos de calidad acordados: alineación anatómica,
 * perspectiva de la cabeza, patillas naturales, material sólido,
 * iluminación coherente y preservación total de la foto original.
 */
export const REALISTIC_TRY_ON_PROMPT = `You are a professional photorealistic photo retoucher specializing in virtual eyewear try-on.

TASK
Edit the FIRST image (a real photograph of a person) so that this exact person is physically wearing the eyeglass frame shown in the SECOND image (a product shot of the frame on a transparent background). The result must be indistinguishable from a genuine photograph of this person wearing these glasses.

PLACEMENT (mandatory)
- Align the frame bridge exactly on the bridge of the nose, and center each lens over its corresponding eye using the iris position as reference.
- Size the frame naturally for this face: lens edges should roughly align with the temples/cheekbones; do not oversize or shrink it.
- The temples (arms) must extend from the frame hinges and rest naturally against the head toward the ears, partially hidden by the head at the correct depth — never floating, never drawn over the hair unnaturally, never duplicated.

PERSPECTIVE (mandatory)
- Respect the perspective and angle of the head in the original photo. The frame must follow the same tilt (roll), turn (yaw) and nod (pitch) as the face, with correct foreshortening and depth. It must NOT look flat, pasted, or floating.

MATERIAL & LIGHTING (mandatory)
- Render the frame as solid, opaque material identical to the product image (metal, acetate, etc.). Never transparent, wireframe, ghosted or semi-visible.
- Lenses behave like real lenses: subtle glass reflections consistent with the scene lighting; the eyes remain clearly visible behind them.
- Match the direction, color and quality of the light in the original photo. If the light is frontal, add a soft, realistic shadow of the frame onto the face. Add natural contact shadows where the frame touches the nose and temples.

STRICT PRESERVATION
- Do not alter the person's identity, facial proportions, features, skin, expression, hair, clothing, pose, the background, the framing or the color grading of the original photo. Only add the glasses and their physically-consistent shadows/reflections.

QUALITY BAR
- No artifacts, no visible borders around the frame, no geometric distortion of lenses or frame, no duplicated lines, no warping of the face.
- Final output: one single photorealistic image with the same framing as the input photo.`;

export const GEMINI_IMAGE_DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

/** Tamaño de salida solicitado a Gemini (1K balancea costo y calidad). */
export const GEMINI_IMAGE_SIZE = "1K" as const;

/** Timeout de la llamada al modelo en milisegundos. */
export const GEMINI_TIMEOUT_MS = 60_000;

/** Relaciones de aspecto soportadas por imageConfig (Gemini 3 image models). */
export const SUPPORTED_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
] as const;

export type AspectRatio = (typeof SUPPORTED_ASPECT_RATIOS)[number];

/** Mensajes de error amigables para el usuario final. */
export const TRY_ON_AI_MESSAGES = {
  notConfigured:
    "El servicio de generación con IA no está configurado. Agrega GEMINI_API_KEY en tu archivo .env.",
  blocked:
    "La foto fue rechazada por las políticas de contenido del modelo. Intenta con otra fotografía clara y bien iluminada.",
  badRequest: "Las imágenes enviadas no son válidas. Vuelve a capturar o subir tu foto.",
  upstream: "El servicio de IA no respondió correctamente. Inténtalo de nuevo en unos segundos.",
  timeout: "La generación tardó demasiado. Inténtalo de nuevo.",
} as const;
