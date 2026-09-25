'use nodejs'

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  },
  from: process.env.EMAIL_FROM || "Óptica Mía <noreply@optica-mia.com>"
}

const LEGACY_PASSWORD_HASH = '$2a$12$legacy_migration_dummy_hash_requiring_reset'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function isLegacyPasswordHash(hash: string | null | undefined): boolean {
  return hash === LEGACY_PASSWORD_HASH
}

export async function registerUser(data: {
  nombre: string
  email: string
  password: string
  telefono?: string
  direccion?: string
}) {
  const passwordHash = await hashPassword(data.password)
  
  const user = await prisma.user.create({
    data: {
      nombre: data.nombre,
      email: data.email.toLowerCase(),
      passwordHash,
      telefono: data.telefono || "",
      direccion: data.direccion || "",
      hasCompletedOnboarding: true
    }
  })
  
  return { id: user.id, email: user.email, nombre: user.nombre, role: user.role }
}

export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt }
  })
  
  return { user, token }
}

export async function verifyPasswordResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  })
  
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return null
  }
  
  return resetToken
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await verifyPasswordResetToken(token)
  if (!resetToken) throw new Error("Token inválido o expirado")
  
  const passwordHash = await hashPassword(newPassword)
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })
  ])
  
  return true
}

const transporter = nodemailer.createTransport(EMAIL_CONFIG)

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: "Restablecer contraseña - Óptica Mía",
    html: `
      <h1>Restablecer contraseña</h1>
      <p>Haz clic en el enlace para crear una nueva contraseña:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>El enlace expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este email.</p>
    `
  })
}

export async function sendWelcomeEmail(email: string, nombre: string) {
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: "Bienvenido a Óptica Mía",
    html: `
      <h1>¡Bienvenido, ${nombre}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
    `
  })
}

export async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL!
  const adminPassword = process.env.ADMIN_PASSWORD!
  
  const passwordHash = await hashPassword(adminPassword)
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "admin", nombre: "Admin" },
    create: { email: adminEmail, nombre: "Admin", passwordHash, role: "admin" }
  })
}