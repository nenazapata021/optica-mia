import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId requerido" }, { status: 400 });
  }
  const favorites = await prisma.favorite.findMany({
    where: { customerId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const { customerId, productId } = await request.json();
  if (!customerId || !productId) {
    return NextResponse.json({ error: "customerId y productId requeridos" }, { status: 400 });
  }
  const existing = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { customerId, productId } });
  return NextResponse.json({ favorited: true }, { status: 201 });
}
