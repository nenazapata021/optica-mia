import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Correo requerido" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: "Error de configuración del servidor" }, { status: 500 });
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Correo no autorizado" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
