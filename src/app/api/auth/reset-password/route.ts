import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/userAuth"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`reset:${ip}`, { windowMs: 60_000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 })
  }

  const { token, password } = await request.json()
  if (!token || !password) {
    return NextResponse.json({ error: "Token y contraseña requeridos" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 })
  }

  try {
    await resetPassword(token, password)
    return NextResponse.json({ ok: true, message: "Contraseña actualizada" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}