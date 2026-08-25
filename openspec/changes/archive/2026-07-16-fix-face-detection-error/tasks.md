## 1. Fix Type Narrowing in detectarRostro

- [x] 1.1 Split the compound guard into two sequential checks: null/undefined check first, then image readiness check
- [x] 1.2 Verify `detector.detect(imagen)` receives a narrowed `HTMLImageElement` with no TS error

## 2. Suppress XNNPACK Delegate Log

- [x] 2.1 Add `localStorage.setItem('tfjs-logs', 'disabled')` before the dynamic import of `@mediapipe/tasks-vision`
- [x] 2.2 Verify log is suppressed in dev console

## 3. Verify Build

- [x] 3.1 Run `npx tsc --noEmit` and confirm zero type errors
- [x] 3.2 Run `npm run lint` and confirm no new warnings
- [x] 3.3 Run `npm run build` and confirm successful compilation
