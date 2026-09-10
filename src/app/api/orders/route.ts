import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      customerId,
      items,
    }: {
      customerId: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
    } = await request.json();
    if (!customerId || !items?.length) {
      return NextResponse.json({ error: "customerId e items requeridos" }, { status: 400 });
    }
    const totalInCents = Math.round(items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0) * 100);
    const productIds = items.map((item: { productId: string }) => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    const missingIds = [...new Set(productIds)].filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Productos inexistentes en el catálogo: ${missingIds.join(", ")}`, missingIds },
        { status: 400 }
      );
    }
    const order = await prisma.order.create({
      data: {
        customerId,
        totalInCents,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerCity: "",
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ id: order.id, total: order.totalInCents / 100 }, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
