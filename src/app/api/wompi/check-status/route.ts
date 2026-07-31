import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getTransaction } from "@/src/services/wompi";
import { isDemoMode } from "@/src/services/paymentDemo";

const DEMO_NEQUI_APPROVE_DELAY_MS = 8000;

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get("transactionId");
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId requerido" },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      const order = await prisma.order.findFirst({
        where: { transactionId },
      });
      let status = order?.wompiStatus ?? "PENDING";

      if (order?.paymentMethod === "NEQUI" && status !== "APPROVED") {
        const elapsed = Date.now() - new Date(order.createdAt).getTime();
        if (elapsed >= DEMO_NEQUI_APPROVE_DELAY_MS) {
          status = "APPROVED";
          await prisma.order.updateMany({
            where: { transactionId },
            data: { wompiStatus: "APPROVED", status: "confirmado" },
          });
        }
      }

      return NextResponse.json({
        transaction: { id: transactionId, status },
      });
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
