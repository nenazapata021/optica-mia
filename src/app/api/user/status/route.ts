import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const customerSelect = {
  hasCompletedOnboarding: true,
  orders: { select: { id: true } },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  try {
    let customer:
      | { hasCompletedOnboarding: boolean; orders: { id: string }[] }
      | null = null;

    if (email) {
      customer = await prisma.customer.findUnique({
        where: { email },
        select: customerSelect,
      });
    } else {
      const cookieStore = await cookies();
      const cid = cookieStore.get("cid")?.value;
      if (cid) {
        customer = await prisma.customer.findUnique({
          where: { id: cid },
          select: customerSelect,
        });
      }
    }

    const isFirstTime =
      !customer || (!customer.hasCompletedOnboarding && customer.orders.length === 0);

    return NextResponse.json({ isFirstTime }, { status: 200 });
  } catch {
    return NextResponse.json(
      { isFirstTime: true, error: "Error al verificar estado" },
      { status: 500 }
    );
  }
}