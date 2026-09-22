// Llave Bre-B configurable — valor viene de env, no hardcodeado en TSX
// Cambiar solo en .env / .env.example y reconstruir (NEXT_PUBLIC_ se inyecta en build)
export const BREB_KEY = process.env.NEXT_PUBLIC_BREB_KEY ?? "";

export const isBrebConfigured = BREB_KEY.length > 0;

// Helper para mostrar en UI con fallback
export function getBrebDisplayValue(): string {
  return BREB_KEY || "@MGA313" || "No configurada";
}
