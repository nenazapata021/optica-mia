'use nodejs'

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { verifyPassword, isLegacyPasswordHash } from "@/lib/userAuth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.passwordHash) return null
        
        const isValid = await verifyPassword(
          credentials.password as string, 
          user.passwordHash
        )
        
        if (!isValid) return null
        
        const isLegacy = isLegacyPasswordHash(user.passwordHash)
        
        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          role: user.role,
          isLegacy: isLegacy
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isLegacy = (user as any).isLegacy
      }
      if (trigger === "update" && session) {
        token.name = session.user?.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).isLegacy = token.isLegacy
      }
      return session
    },
    async signIn({ user }) {
      return true
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/registro"
  },
  events: {
    async createUser({ user }) {
    }
  },
  session: { 
    strategy: "jwt", 
    maxAge: 60 * 60 * 24 * 30
  },
  secret: process.env.AUTH_SECRET
})