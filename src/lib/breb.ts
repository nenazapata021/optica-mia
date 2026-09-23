// Llave Bre-B configurable — valor viene de env, no hardcodeado en TSX
// Cambiar solo en .env / .env.example y reconstruir (NEXT_PUBLIC_ se inyecta en build time)
// Preferencia: env > fallback @MGA313 > vacío
const RAW_BREB_KEY = (process.env.NEXT_PUBLIC_BREB_KEY ?? "").trim();

export const BREB_KEY = RAW_BREB_KEY || "@MGA313";

export const isBrebConfigured = BREB_KEY.length > 0 && BREB_KEY !== "No configurada";

// Helper para mostrar en UI con fallback — nunca retorna vacío
export function getBrebDisplayValue(): string {
  return BREB_KEY || "@MGA313";
}
