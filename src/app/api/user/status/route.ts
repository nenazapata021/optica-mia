import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ isFirstTime: true }, { status: 200 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        hasCompletedOnboarding: true,
        orders: { select: { id: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ isFirstTime: true }, { status: 200 });
    }

    const isFirstTime =
      !customer.hasCompletedOnboarding && customer.orders.length === 0;

    return NextResponse.json({ isFirstTime }, { status: 200 });
  } catch {
    return NextResponse.json(
      { isFirstTime: false, error: "Error al verificar estado" },
      { status: 500 }
    );
  }
}