import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  try {
    const { customerId, items } = await request.json();
    if (!customerId || !items?.length) {
      return NextResponse.json({ error: "customerId e items requeridos" }, { status: 400 });
    }
    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const order = await prisma.order.create({
      data: {
        customerId,
        total,
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
    return NextResponse.json({ id: order.id, total: order.total }, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
