import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/services/paymentDemo";

export async function POST(request: Request) {
  try {
    // Bloqueo total en producción aunque isDemoMode falle
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
    }
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: "El modo demo está desactivado" },
        { status: 400 }
      );
    }

    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId requerido" },
        { status: 400 }
      );
    }

    const result = await prisma.order.updateMany({
      where: { transactionId },
      data: { wompiStatus: "APPROVED", status: "confirmado" },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Wompi demo-approve error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
