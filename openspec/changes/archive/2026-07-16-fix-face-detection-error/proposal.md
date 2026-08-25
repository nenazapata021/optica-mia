## Why

The virtual try-on component (`SimulacionVirtual.tsx`) crashes at runtime when `detector.detect(imagen)` is called because TypeScript cannot narrow the type of `imagen` through the compound guard clause, leaving a `null | undefined` path at the call site. Additionally, TensorFlow Lite logs an XNNPACK delegate message that clutters the console.

## What Changes

- Fix the type narrowing issue so `detector.detect()` receives a guaranteed `HTMLImageElement`
- Suppress the TensorFlow Lite XNNPACK info log in development
- Only `src/app/components/SimulacionVirtual.tsx` is modified

## Capabilities

### New Capabilities

- `face-detection`: Robust face landmark detection for virtual try-on overlay positioning

### Modified Capabilities

*(none)*

## Impact

Single file change in `src/app/components/SimulacionVirtual.tsx`. No new dependencies. No API or spec-level contract changes.
