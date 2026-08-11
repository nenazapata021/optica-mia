import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WOMPI_EVENT_SECRET = process.env.WOMPI_EVENT_SECRET ?? "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-signature") ?? "";

    if (WOMPI_EVENT_SECRET && signature !== WOMPI_EVENT_SECRET) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const event = body.event;
    const transaction = body.data?.transaction;

    if (!transaction?.id) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const wompiStatus: string = transaction.status;
    let orderStatus = "pendiente";

    if (wompiStatus === "APPROVED") {
      orderStatus = "confirmado";
    } else if (wompiStatus === "DECLINED" || wompiStatus === "VOIDED") {
      orderStatus = "rechazado";
    } else if (wompiStatus === "ERROR") {
      orderStatus = "error";
    }

    await prisma.order.updateMany({
      where: { transactionId: transaction.id },
      data: {
        wompiStatus,
        status: orderStatus,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
