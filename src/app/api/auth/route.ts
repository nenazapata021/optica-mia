import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`auth:${ip}`, { windowMs: 15 * 60_000, max: 5 }); // 5 intentos / 15 min
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Intenta en 15 minutos." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now())/1000)) } });
  }

  const { email } = await request.json().catch(() => ({} as { email?: string }));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Correo requerido" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: "Error de configuración del servidor" }, { status: 500 });
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    // Respuesta genérica + delay para mitigar timing attack / fuerza bruta
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ ok: false, error: "Correo no autorizado" }, { status: 401 });
  }

  const token = signAdminToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
  return res;
}
