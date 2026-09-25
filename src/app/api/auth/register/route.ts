import { NextResponse } from "next/server"
import { registerUser, sendWelcomeEmail } from "@/lib/userAuth"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`register:${ip}`, { windowMs: 60_000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { nombre, email, password, telefono, direccion } = body

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 })
    }

    const user = await registerUser({ nombre, email, password, telefono, direccion })
    await sendWelcomeEmail(user.email, user.nombre)

    return NextResponse.json({ 
      user, 
      redirect: "/perfil"
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 })
    }
    console.error("Register error:", error)
    return NextResponse.json({ error: "Error en registro" }, { status: 500 })
  }
}