import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  try {
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

    const validos = favorites.filter((f) => f.product !== null);
    const invalidos = favorites.filter((f) => f.product === null);
    if (invalidos.length > 0) {
      await prisma.favorite.deleteMany({
        where: { id: { in: invalidos.map((f) => f.id) } },
      });
    }

    return NextResponse.json({ favorites: validos });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ error: "Error al obtener favoritos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Error al actualizar favorito" }, { status: 500 });
  }
}
