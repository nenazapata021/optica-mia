import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userSelect = {
  hasCompletedOnboarding: true,
  orders: { select: { id: true } },
} as const;

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ isFirstTime: true }, { status: 200 });
    }

    const userId = (session.user as any).id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    const isFirstTime =
      !user || (!user.hasCompletedOnboarding && user.orders.length === 0);

    return NextResponse.json({ isFirstTime }, { status: 200 });
  } catch {
    return NextResponse.json(
      { isFirstTime: true, error: "Error al verificar estado" },
      { status: 500 }
    );
  }
}