/**
 * Rate limiter en memoria para Next.js API Routes (edge-compatible simple).
 * Para producción con múltiples instancias usar Redis (Upstash).
 * Uso: const { allowed, remaining } = rateLimit(`ip:${ip}:auth`, { windowMs: 60000, max: 5 });
 */
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.max - 1, resetAt };
  }
  entry.count += 1;
  const allowed = entry.count <= opts.max;
  return { allowed, remaining: Math.max(0, opts.max - entry.count), resetAt: entry.resetAt };
}

// Limpieza periódica (cada 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (now > v.resetAt) store.delete(k);
  }, 5 * 60 * 1000).unref?.();
}

export function getClientIp(req: Request): string {
  const h = (req.headers as unknown as { get: (k: string) => string | null }).get?.bind(req.headers);
  // NextRequest tiene req.headers.get
  try {
    // @ts-ignore
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}
