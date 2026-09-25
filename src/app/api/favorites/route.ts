import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId, productId } });
    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Error al actualizar favorito" }, { status: 500 });
  }
}