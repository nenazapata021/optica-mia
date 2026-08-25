# Errores Organizados — Óptica Mía

Este archivo documenta TODOS los errores encontrados en el código.
**NUNCA se modifica código que no sea un error.**

---

## 1. `src/app/hooks/useCart.js` — Ruta de importación incorrecta

**Archivo:** `src/app/hooks/useCart.js` (línea 1)

**Error:** Importa `../context/CartContext.jsx` pero el archivo real es `CartContextType.tsx`

```js
// ❌ INCORRECTO
export { CartContextType, useCart, CartProvider } from '../context/CartContext.jsx';

// ✅ CORRECTO
export { CartContextType, useCart, CartProvider } from '../context/CartContextType.tsx';
```

---

## 2. `src/app/context/CartContextType.tsx` — Manejo silencioso de parseo fallido

**Archivo:** `src/app/context/CartContextType.tsx` (línea 44-48)

**Error:** Si `localStorage.getItem("cart")` devuelve un string inválido, `JSON.parse` lanza un error que se captura con `console.error` pero `setCartItems` nunca se ejecuta. El estado del carrito se queda estancado con datos anteriores en lugar de resetearse a `[]`.

```ts
// ❌ INCORRECTO: no resetea el carrito en caso de parseo fallido
catch (error) {
  console.error("Error al cargar el carrito desde localStorage", error);
}

// ✅ CORRECTO: resetear a [] o lanzar un error
catch (error) {
  console.error("Error al cargar el carrito desde localStorage", error);
  setCartItems([]);
}
```

---

## 3. `src/app/services/productoService.ts` — Archivo no existe

**Archivo:** `src/app/services/productoService.ts`

**Error:** Este archivo no existe en la ruta `src/app/services/`. La importación desde `api/productos/route.ts` referenciaba este archivo inexistente.

```
❌ No existe: src/app/services/productoService.ts
```

---

## 4. `src/app/services/carritoService.ts` — Archivo no existe

**Archivo:** `src/app/services/carritoService.ts`

**Error:** Este archivo no existe en la ruta `src/app/services/`. No hay ningún archivo que lo importe.

```
❌ No existe: src/app/services/carritoService.ts
```

---

## 5. `src/app/services/wompi.ts` — Archivo no existe

**Archivo:** `src/app/services/wompi.ts`

**Error:** Este archivo no existe en la ruta `src/app/services/`. El `api/wompi/` tiene rutas que lo importan (`create-transaction`, `check-status`, `demo-approve`, `webhook`).

```
❌ No existe: src/app/services/wompi.ts
```

---

## 6. `src/app/services/paymentDemo.ts` — Archivo no existe

**Archivo:** `src/app/services/paymentDemo.ts`

**Error:** Este archivo no existe en la ruta `src/app/services/`. La ruta `api/wompi/demo-approve/route.ts` lo importa.

```
❌ No existe: src/app/services/paymentDemo.ts
```

---

## 7. `src/app/api/customers/route.ts` — Importación incorrecta de prisma

**Archivo:** `src/app/api/customers/route.ts` (línea 2)

**Error:** Importa `prisma` desde `@/src/lib/prisma` pero la ruta de alias `@/` mapea a `src/`, por lo que `@/src/lib/prisma` es `src/src/lib/prisma.ts` que **no existe**. La ruta correcta es `@/lib/prisma`.

```ts
// ❌ INCORRECTO (pasaría por src/src/lib/prisma)
import { prisma } from "@/src/lib/prisma";

// ✅ CORRECTO
import { prisma } from "@/lib/prisma";
```

---

## 8. `src/app/api/auth/route.ts` — Importación incorrecta de prisma

**Archivo:** `src/app/api/auth/route.ts` (línea 2)

**Error:** Igual que el anterior, usa `@/src/lib/prisma` en lugar de `@/lib/prisma`.

```ts
// ❌ INCORRECTO
import { prisma } from "@/src/lib/prisma";

// ✅ CORRECTO
import { prisma } from "@/lib/prisma";
```

---

## 9. `src/app/api/orders/route.ts` — Importación incorrecta de prisma

**Archivo:** `src/app/api/orders/route.ts` (línea 2)

**Error:** Igual que los anteriores, usa `@/src/lib/prisma` en lugar de `@/lib/prisma`.

```ts
// ❌ INCORRECTO
import { prisma } from "@/src/lib/prisma";

// ✅ CORRECTO
import { prisma } from "@/lib/prisma";
```

---

## 10. `src/app/api/favorites/route.ts` — Importación incorrecta de prisma

**Archivo:** `src/app/api/favorites/route.ts` (línea 2)

**Error:** Igual que los anteriores, usa `@/src/lib/prisma` en lugar de `@/lib/prisma`.

```ts
// ❌ INCORRECTO
import { prisma } from "@/src/lib/prisma";

// ✅ CORRECTO
import { prisma } from "@/lib/prisma";
```

---

## 11. `src/app/api/wompi/webhook/route.ts` — Importación incorrecta de prisma

**Archivo:** `src/app/api/wompi/webhook/route.ts` (línea 2)

**Error:** Igual que los anteriores, usa `@/src/lib/prisma` en lugar de `@/lib/prisma`.

```ts
// ❌ INCORRECTO
import { prisma } from "@/src/lib/prisma";

// ✅ CORRECTO
import { prisma } from "@/lib/prisma";
```

---

## 12. `src/app/api/productos/route.ts` — Importa archivo inexistente

**Archivo:** `src/app/api/productos/route.ts` (línea 2)

**Error:** Importa `getProductos` desde `../../../services/productoService` pero ese archivo **no existe** (`productoService.ts` está ausente en `src/app/services/`).

```ts
// ❌ INCORRECTO (archivo no existe)
import { getProductos } from "../../../services/productoService";

// ✅ CORRECTO: debe estar definido o importarse desde el lugar correcto
```

---

## Resumen de errores por archivo

| Archivo | Tipo de Error | Nivel |
|---------|--------------|-------|
| `src/app/hooks/useCart.js` | Importación incorrecta (ruta + extensión) | 🔴 Crítico |
| `src/app/context/CartContextType.tsx` | Manejo silencioso de parseo fallido | 🔴 Crítico |
| `src/app/services/productoService.ts` | Archivo no existe | 🔴 Crítico |
| `src/app/services/carritoService.ts` | Archivo no existe | 🔴 Crítico |
| `src/app/services/wompi.ts` | Archivo no existe | 🔴 Crítico |
| `src/app/services/paymentDemo.ts` | Archivo no existe | 🔴 Crítico |
| `src/app/api/customers/route.ts` | Importación incorrecta de prisma | 🔴 Crítico |
| `src/app/api/auth/route.ts` | Importación incorrecta de prisma | 🔴 Crítico |
| `src/app/api/orders/route.ts` | Importación incorrecta de prisma | 🔴 Crítico |
| `src/app/api/favorites/route.ts` | Importación incorrecta de prisma | 🔴 Crítico |
| `src/app/api/wompi/webhook/route.ts` | Importación incorrecta de prisma | 🔴 Crítico |
| `src/app/api/productos/route.ts` | Importa archivo inexistente | 🔴 Crítico |

---

**Nota:** Los archivos de la columna "Crítico" (productoService, carritoService, wompi.ts, paymentDemo.ts) son los más severos porque su ausencia provoca que rutas API enteras fallen al cargar.
