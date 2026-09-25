import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function isAdminRequest(req: NextRequest | Request): Promise<boolean> {
  const session = await auth()
  return (session?.user as any)?.role === "admin"
}

export const ADMIN_COOKIE_NAME = "optica_admin"