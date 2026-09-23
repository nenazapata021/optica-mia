import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, status, data } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Datos de notificación inválidos" },
        { status: 400 }
      );
    }

    let orderStatus = "pendiente";

    if (status === "approved" || status === "aprobado") {
      orderStatus = "confirmado";
    } else if (status === "rejected" || status === "rechazado" || status === "declined") {
      orderStatus = "rechazado";
    } else if (status === "error") {
      orderStatus = "error";
    }

    await prisma.order.updateMany({
      where: { externalId: id },
      data: {
        paymentProvider: "ADDI",
        status: orderStatus,
        wompiStatus: undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("addi webhook error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}