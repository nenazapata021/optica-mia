import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/auth/register para registro de usuarios." },
    { status: 410 }
  )
}