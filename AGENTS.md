<!-- BEGIN:nextjs-agent-rules -->
# Óptica Mía — Agent Guide

Stack: Next.js 16.2.10 + React 19.2.4 (App Router, `src/app/`), Tailwind v4, ESLint v9 flat config, single npm package.

## Commands

| Action | Command |
|--------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npx tsc --noEmit` (not in `scripts`, run manually) |

No tests or CI exist.

## Routes

| Path | File |
|------|------|
| `/` | `src/app/page.tsx` |
| `/lentes` | `src/app/lentes/page.tsx` |
| `/gafas-de-sol` | `src/app/gafas-de-sol/page.tsx` |
| `/carrito` | `src/app/carrito/page.tsx` |
| `/probador` | `src/app/probador/page.tsx` |

Dead link: header references `/probador-landing` — no route file exists.

## Gotchas

- **Path alias**: `@/*` maps to repo root, **not** `src/` (see `tsconfig.json`).
- **Duplicate CarritoPage**: `src/app/carrito/page.tsx` (active) and `src/app/components/page.tsx` (likely stale).
- **Mixed extensions**: some files use `.js` (`data/productos.js`, `hooks/useCart.js`).
- **Cart**: React Context in `src/app/context/CartContextType.tsx`, persisted to `localStorage`.
- **Virtual try-on**: passes face data via `sessionStorage` between modal and `/probador`.
- **No `.env`** files committed (all `.env*` gitignored). No `process.env` usage in code.
- **Next.js 16** is very recent; `node_modules/next/dist/docs/` does not exist in this version. Watch for API changes vs older Next.js.
- **ESLint ignores** flat config: `.next/`, `out/`, `build/`, `next-env.d.ts`.
<!-- END:nextjs-agent-rules -->
