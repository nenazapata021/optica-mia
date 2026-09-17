import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      date: o.createdAt,
      customerName: o.customerName || "Sin nombre",
      customerEmail: o.customerEmail || "",
      customerPhone: o.customerPhone || "",
      customerCity: o.customerCity || "",
      total: o.totalInCents / 100,
      status: o.status,
      paymentProvider: o.paymentProvider || "",
      items: o.items.map((i) => ({
        productName: i.product?.name || i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

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
        paymentProvider: "WOMPI", // valor por defecto
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
