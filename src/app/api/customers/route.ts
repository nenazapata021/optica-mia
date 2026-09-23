import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}\s'.-]{2,80}$/u;

function sanitize(str: string, maxLen: number): string {
  return str.trim().slice(0, maxLen).replace(/[<>]/g, "");
}

export async function POST(request: Request) {
  // Rate limit: 10 registros / minuto por IP
  const ip = getClientIp(request);
  const rl = rateLimit(`customers:${ip}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

    let { nombre, email, telefono, direccion, aceptaTratamientoDatos } = body as {
      nombre?: string; email?: string; telefono?: string; direccion?: string; aceptaTratamientoDatos?: boolean;
    };

    nombre = sanitize(String(nombre || ""), 80);
    email = String(email || "").trim().toLowerCase().slice(0, 120);
    telefono = String(telefono || "").trim().slice(0, 20);
    const dir = sanitize(String(direccion || ""), 200);

    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 });
    }
    if (!NAME_RE.test(nombre)) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    // Ley 1581: consentimiento explícito requerido
    if (aceptaTratamientoDatos === false) {
      return NextResponse.json({ error: "Debes aceptar la política de tratamiento de datos (Ley 1581)" }, { status: 400 });
    }

    const customer = await prisma.customer.upsert({
      where: { email },
      update: { nombre, telefono: telefono || "", direccion: dir, hasCompletedOnboarding: true },
      create: { nombre, email, telefono: telefono || "", direccion: dir, hasCompletedOnboarding: true },
    });

    const res = NextResponse.json(
      { id: customer.id, email: customer.email, nombre: customer.nombre },
      { status: 201 }
    );
    // httpOnly + secure + sameSite strict — evita robo vía XSS
    res.cookies.set("cid", customer.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días (no 1 año)
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Error al guardar cliente" }, { status: 500 });
  }
}
