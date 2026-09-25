import { NextResponse } from "next/server"
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/userAuth"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`forgot:${ip}`, { windowMs: 60_000, max: 3 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

  const result = await createPasswordResetToken(email.toLowerCase())
  if (result) {
    await sendPasswordResetEmail(result.user.email, result.token)
  }

  return NextResponse.json({ ok: true, message: "Si el email existe, recibirás instrucciones" })
}