export const TRY_ON_CONFIG = {
  faceLandmarker: {
    modelUrl: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
    basePath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
    runningMode: "IMAGE" as const,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    maxFaces: 1,
  },
  canvas: {
    maxWidth: 800,
  },
  camera: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user" as const,
  },
  upload: {
    maxSizeBytes: 10 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  overlay: {
    glassesWidthMultiplier: 1.8,
    verticalOffsetRatio: -0.08,
    storageKey: "optica-mia-try-on",
  },
  messages: {
    noFace: "No pudimos detectar tu rostro. Intenta con una foto frontal y bien iluminada, sin tapar tu cara.",
    multipleFaces: "Solo debe aparecer una persona en la foto.",
    modelError: "No se pudo cargar el modelo de detección facial. Verifica tu conexión.",
    detectionError: "Ocurrió un error al procesar la imagen. Intenta con otra foto.",
    cameraDenied: "No tenemos permiso para usar la cámara. Ve a la configuración de tu navegador, permite el acceso y recarga.",
    cameraNotFound: "No se encontró ninguna cámara en tu dispositivo.",
    cameraInUse: "La cámara está siendo usada por otra aplicación.",
    cameraError: "No se pudo activar la cámara. Revisa los permisos o sube una foto.",
    uploadError: "La imagen no es válida. Usa JPG, PNG o WEBP (máx 10 MB).",
    imageNotReady: "La imagen aún no está lista para analizarse. Intenta nuevamente.",
  },
} as const;
