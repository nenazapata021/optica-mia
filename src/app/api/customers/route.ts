import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  try {
    const { nombre, email, telefono, direccion } = await request.json();
    if (!nombre || !email || !telefono || !direccion) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const customer = await prisma.customer.upsert({
      where: { email },
      update: { nombre, telefono, direccion },
      create: { nombre, email, telefono, direccion },
    });
    return NextResponse.json({ id: customer.id, email: customer.email }, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Error al guardar cliente" }, { status: 500 });
  }
}
