import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        categoria: true,
        color: true,
        stock: true,
      },
    });

    const orderItems = await prisma.orderItem.findMany({
      select: {
        quantity: true,
        price: true,
        product: {
          select: { categoria: true, color: true },
        },
      },
    });

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    const categoryMap = new Map<
      string,
      { stock: number; count: number; totalPrice: number; sales: number }
    >();

    const colorMap = new Map<string, { sales: number; count: number }>();

    for (const p of products) {
      const cat = p.categoria;
      const existing = categoryMap.get(cat) ?? {
        stock: 0,
        count: 0,
        totalPrice: 0,
        sales: 0,
      };
      existing.stock += p.stock;
      existing.count += 1;
      existing.totalPrice += p.price;
      categoryMap.set(cat, existing);

      const colorExisting = colorMap.get(p.color ?? "sin color") ?? { sales: 0, count: 0 };
      colorExisting.count += 1;
      categoryMap.set(cat, existing);
    }

    for (const item of orderItems) {
      const cat = item.product.categoria;
      const color = item.product.color ?? "sin color";
      const salesValue = item.quantity * item.price;

      const colorExisting = colorMap.get(color) ?? { sales: 0, count: 0 };
      colorExisting.sales += salesValue;
      colorExisting.count += 1;
      colorMap.set(color, colorExisting);

      const existing = categoryMap.get(cat) ?? {
        stock: 0,
        count: 0,
        totalPrice: 0,
        sales: 0,
      };
      existing.sales += salesValue;
      existing.count += 1;
      categoryMap.set(cat, existing);
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        stock: data.stock,
        productCount: data.count,
        avgPrice: data.count > 0 ? data.totalPrice / data.count : 0,
        sales: data.sales,
      })
    );

    const byColor = Array.from(colorMap.entries()).map(
      ([color, data]) => ({
        color,
        sales: data.sales,
        productCount: data.count,
      })
    ).sort((a, b) => b.sales - a.sales);

    return NextResponse.json({
      totalStock,
      byCategory,
      byColor,
    });
  } catch (error) {
    console.error("Error fetching product stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
