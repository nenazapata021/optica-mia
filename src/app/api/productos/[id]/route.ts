import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, price, image, categoria, color, descripcion, modelo } =
    await request.json();

  const product = await prisma.product.update({
    where: { id },
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