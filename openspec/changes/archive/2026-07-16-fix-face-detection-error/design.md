## Context

`src/app/components/SimulacionVirtual.tsx` uses `@mediapipe/tasks-vision` for face landmark detection. The `detectarRostro` function receives an `HTMLImageElement`, but the `const imagen = imagenCargada ?? fotoRef.current` produces `HTMLImageElement | null`. The compound guard `if (!imagen || !imagen.complete || ...)` should theoretically narrow the type, but TypeScript doesn't narrow through the `??` + compound `||` combination, leaving a potential `null` path at `detector.detect(imagen)`. The TensorFlow Lite XNNPACK delegate info log is harmless console noise emitted during WASM delegate initialization.

## Goals / Non-Goals

**Goals:**
- Eliminate the TypeScript error at line 40 by giving `detector.detect()` a guaranteed non-null `HTMLImageElement`
- Suppress the XNNPACK info log in dev

**Non-Goals:**
- No API changes or dependency upgrades
- No changes to MediaPipe model URL, WASM path, or detection logic
- No refactoring beyond the minimal fix

## Decisions

1. **Separate the null guard from the readiness check** — Splitting the compound `||` condition into two sequential guards lets TypeScript narrow `imagen` to `HTMLImageElement` after the first check, so the `.complete` / `.naturalWidth` / `.naturalHeight` access and subsequent `detect()` call are all type-safe.
2. **Suppress XNNPACK log via `localStorage` flag** — MediaPipe/TFLite respects a `tfjs-logs` flag. Setting `localStorage.setItem('tfjs-logs', 'disabled')` before the dynamic import silences the delegate message without monkey-patching `console`.

## Risks / Trade-offs

- `localStorage` flag approach is not future-proof if a future TFLite version changes its logging behavior; at that point the suppression can simply be removed — it's cosmetic.
- Splitting the guard is a trivial refactor with zero behavioral change; risk is negligible.
