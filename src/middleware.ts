import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/perfil") ||
                        req.nextUrl.pathname.startsWith("/carrito/checkout") ||
                        req.nextUrl.pathname.startsWith("/mis-pedidos")
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/registro") ||
                     req.nextUrl.pathname.startsWith("/forgot-password") ||
                     req.nextUrl.pathname.startsWith("/reset-password")
  
  if (isOnDashboard && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/login?callback=${callbackUrl}`, req.url))
  }
  
  if (isAdminRoute && isLoggedIn && (req.auth as any).user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  if (isAuthPage && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get("callback") || "/"
    return NextResponse.redirect(new URL(callbackUrl, req.url))
  }
  
  if (isLoggedIn && (req.auth as any).user?.isLegacy && 
      !req.nextUrl.pathname.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL("/reset-password?legacy=true", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/perfil/:path*",
    "/carrito/checkout",
    "/mis-pedidos/:path*",
    "/admin/:path*",
    "/login",
    "/registro",
    "/forgot-password",
    "/reset-password"
  ]
}