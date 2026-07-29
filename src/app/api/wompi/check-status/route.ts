import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getTransaction } from "@/src/services/wompi";

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get("transactionId");
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId requerido" },
        { status: 400 }
      );
    }

    const wompiTx = await getTransaction(transactionId);

    await prisma.order.updateMany({
      where: { transactionId },
      data: { wompiStatus: wompiTx.data.status },
    });

    if (wompiTx.data.status === "APPROVED") {
      await prisma.order.updateMany({
        where: { transactionId },
        data: { status: "confirmado" },
      });
    }

    return NextResponse.json({ transaction: wompiTx.data });
  } catch (error) {
    console.error("Wompi check-status error:", error);
    return NextResponse.json(
      { error: "Error al verificar transacción" },
      { status: 500 }
    );
  }
}
