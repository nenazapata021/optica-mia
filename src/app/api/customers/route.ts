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

    const res = NextResponse.json(
      { id: customer.id, email: customer.email, nombre: customer.nombre },
      { status: 201 }
    );
    res.cookies.set("cid", customer.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
    return res;
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Error al guardar cliente" }, { status: 500 });
  }
}
