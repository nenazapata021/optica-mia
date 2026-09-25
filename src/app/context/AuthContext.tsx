"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  nombre: string
  role: string
  isLegacy?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}

interface RegisterData {
  nombre: string
  email: string
  password: string
  telefono?: string
  direccion?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: (session.user as any).id,
        email: session.user.email!,
        nombre: session.user.name!,
        role: (session.user as any).role,
        isLegacy: (session.user as any).isLegacy
      })
    } else if (status === "unauthenticated") {
      setUser(null)
    }
    setIsLoading(false)
  }, [session, status])

  const login = async (email: string, password: string, callbackUrl = "/") => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    })
    if (result?.error) throw new Error(result.error)
    router.push(callbackUrl)
    router.refresh()
  }

  const register = async (data: RegisterData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error en registro")
    }
    await login(data.email, data.password, "/perfil")
  }

  const logout = async () => {
    await signOut({ redirect: false })
    router.push("/")
    router.refresh()
  }

  const forgotPassword = async (email: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    if (!res.ok) throw new Error("Error enviando email")
  }

  const resetPassword = async (token: string, password: string) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error restableciendo contraseña")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return context
}