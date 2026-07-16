## ADDED Requirements

### Requirement: Detect face landmarks from user photo
The system SHALL detect face landmarks from an uploaded user photo using MediaPipe FaceLandmarker to position virtual glasses overlays.

#### Scenario: Successful face detection
- **WHEN** a user uploads a photo with a visible frontal face
- **THEN** the system SHALL return face landmarks with eye positions (indices 33 and 263) to calculate overlay position, width, and angle

#### Scenario: No face detected
- **WHEN** the uploaded photo does not contain a detectable face
- **THEN** the system SHALL display a user-friendly message: "No pudimos detectar el rostro. Intenta con una foto frontal y bien iluminada."

### Requirement: Handle detection errors gracefully
The system SHALL recover from face detection errors without crashing and SHALL provide user feedback.

#### Scenario: Detection runtime error
- **WHEN** the face landmarker throws an error during `detect()`
- **THEN** the system SHALL display: "Ocurrió un error al procesar la imagen. Por favor, intenta con otra foto."

#### Scenario: Model loading failure
- **WHEN** the MediaPipe model or WASM files fail to load (e.g., no network)
- **THEN** the system SHALL display: "No se pudo cargar la detección facial. Verifica tu conexión e inténtalo de nuevo."

### Requirement: Type-safe image input to detector
The system SHALL guarantee that `FaceLandmarker.detect()` receives a non-null `HTMLImageElement` to prevent runtime TypeErrors.

#### Scenario: Null input guard
- **WHEN** the image element is `null` or `undefined`
- **THEN** the system SHALL return early before calling `detect()` and display: "La imagen aún no está lista para analizarse. Intenta nuevamente."

#### Scenario: Incomplete image guard
- **WHEN** the image has not finished loading (`!imagen.complete`) or has zero dimensions
- **THEN** the system SHALL return early before calling `detect()` and display the same readiness message
