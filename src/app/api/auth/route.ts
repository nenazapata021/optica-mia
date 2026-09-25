import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/auth/[...nextauth] para autenticación." },
    { status: 410 }
  )
}