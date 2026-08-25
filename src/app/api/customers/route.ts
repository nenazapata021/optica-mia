import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { nombre, email, telefono, direccion } = await request.json();
    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 });
    }
    const dir = direccion || "";
    const customer = await prisma.customer.upsert({
      where: { email },
      update: { nombre, telefono: telefono || "", direccion: dir, hasCompletedOnboarding: true },
      create: { nombre, email, telefono: telefono || "", direccion: dir, hasCompletedOnboarding: true },
    });
    return NextResponse.json({ id: customer.id, email: customer.email }, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Error al guardar cliente" }, { status: 500 });
  }
}
