import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  
  return NextResponse.json({ 
    user: {
      id: (session.user as any).id,
      email: session.user.email,
      nombre: session.user.name,
      role: (session.user as any).role,
      isLegacy: (session.user as any).isLegacy
    }
  })
}