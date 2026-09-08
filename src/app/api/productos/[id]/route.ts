import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = await prisma.producto.findUnique({
    where: { id: params.id },
  });

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { name, price, image, categoria, color, descripcion, modelo } =
    await request.json();

  const product = await prisma.producto.update({
    where: { id: params.id },
    data: {
      name,
      price,
      image,
      categoria,
      color,
      descripcion,
      modelo,
    },
  });

  return NextResponse.json({ ok: true, product });
}