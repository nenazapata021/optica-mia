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
  faceMeshEngine: {
    leftEyeIndices: [33, 133, 159, 145, 153, 154, 155, 157, 158, 160, 161, 173] as readonly number[],
    rightEyeIndices: [362, 263, 386, 374, 380, 381, 382, 384, 385, 387, 388, 390] as readonly number[],
    leftIrisIndices: [468, 469, 470, 471, 472] as readonly number[],
    rightIrisIndices: [473, 474, 475, 476, 477] as readonly number[],
    /** Inner eye corner landmarks: 133 (left), 362 (right) — used for bridge center. */
    innerEyeCornerIndices: { left: 133, right: 362 } as const,
    noseBridgeIndices: [6, 197, 195, 5, 168] as readonly number[],
    faceOvalIndices: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
      361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
      176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ] as readonly number[],
    /** Left ear / temple landmark index. */
    earLeftIndex: 234,
    /** Right ear / temple landmark index. */
    earRightIndex: 454,
    /** Nose tip landmark index (with z-depth). */
    noseTipIndex: 1,
    glassesWidthMultiplier: 2.1,
    verticalOffsetRatio: 0,
    minIrisLandmarks: 478,
  },
  temple: {
    /**
     * Reference interpupillary distance in pixels for which the frontal
     * glasses asset was designed. Used to compute the dynamic scale factor:
     *   scaleRefFactor = detectedIPD / referenceIpdPx
     */
    referenceIpdPx: 150,
    /** Base length of the temple arm asset in pixels (measured at 1:1). */
    baseLengthPx: 180,
    /** Base width of the temple arm asset in pixels. */
    baseWidthPx: 30,
    /** Minimum opacity for a temple arm (when fully turned away). */
    minOpacity: 0.15,
    /** Maximum opacity (when fully facing the viewer). */
    maxOpacity: 0.95,
    /** Margin factor for temple-to-temple width (0.95 = 5% skin margin each side). */
    templeMarginFactor: 0.95,
  },
  liveEngine: {
    /** Vista espejada estilo selfie (el video se muestra con scaleX(-1)). */
    mirrorPreview: true,
    /** Pómulo/sien izquierdo — usado para el roll. */
    cheekLeftIndex: 127,
    /** Pómulo/sien derecho — usado para el roll. */
    cheekRightIndex: 356,
    /** Punto entre cejas (anclaje vertical superior). */
    glabellaIndex: 6,
    /** Puente nasal (anclaje vertical). */
    noseBridgeIndex: 168,
    /** Punta de la nariz (yaw/pitch). */
    noseTipIndex: 1,
    /** Base de la nariz (yaw/pitch). */
    noseBaseIndex: 4,
    /** Puente nasal inferior (yaw/pitch). */
    noseBridgeLowerIndex: 5,
  },
  smoothing: {
    positionAlpha: 0.35,
    angleAlpha: 0.22,
    scaleAlpha: 0.3,
    deadZonePx: 0.8,
  },
  clamps: {
    maxYawDeg: 25,
    maxPitchDeg: 15,
  },
  perspectivePx: 900,
  /** IPD promedio adulto en mm, base de calibración. */
  referenceIpdMm: 63,
  /**
   * Escala base de montura: ancho_total_montura_px / IPD_px_referencia.
   * Equivalente a ancho_frontal_mm ≈ 136 / 63 mm.
   */
  baseFrameScale: 2.16,
  /** Con delegate CPU procesar 1 de cada N frames. */
  cpuThrottleDivisor: 2,
  /** Gracia antes de mostrar "rostro no detectado" en vivo. */
  faceLostGraceMs: 800,
  canvas: {
    maxWidth: 800,
  },
  upload: {
    maxSizeBytes: 10 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  overlay: {
    glassesWidthMultiplier: 2.1,
    verticalOffsetRatio: 0,
    storageKey: "optica-mia-try-on",
  },
  messages: {
    noFace: "No pudimos detectar tu rostro. Intenta con una foto frontal y bien iluminada, sin tapar tu cara.",
    multipleFaces: "Solo debe aparecer una persona en la foto.",
    modelError: "No se pudo cargar el modelo de detección facial. Verifica tu conexión.",
    detectionError: "Ocurrió un error al procesar la imagen. Intenta con otra foto.",
    uploadError: "La imagen no es válida. Usa JPG, PNG o WEBP (máx 10 MB).",
    imageNotReady: "La imagen aún no está lista para analizarse. Intenta nuevamente.",
    cameraDenied: "No autorizaste el acceso a la cámara. Habilítala en los permisos del navegador e inténtalo de nuevo.",
    cameraNotFound: "No encontramos una cámara conectada a tu dispositivo.",
    modelErrorLive: "No se pudo cargar el motor de detección facial. Verifica tu conexión e inténtalo de nuevo.",
    noFaceLive: "No detectamos tu rostro. Ubícate de frente a la cámara con buena iluminación.",
  },
  webgl: {
    enabled: true,
    forceFallback: false,
    mobileHDRSize: 256,
    desktopHDRSize: 512,
    maxFrameTimeMs: 16,
    enableHairOcclusion: true,
    enableContactShadows: true,
    enableChromaticAberration: true,
    enableSubsurface: true,
    enableColorGrading: true,
    enableVignette: false,
    vignetteIntensity: 0.15,
    defaultEnvironmentMap: "/environments/studio_small_09_1k.hdr",
    framesBaseUrl: "/monturas/frames",
    assetValidation: true,
  },
} as const;
