import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransaction } from "@/services/wompi";
import { isDemoMode } from "@/services/paymentDemo";

const DEMO_NEQUI_APPROVE_DELAY_MS = 8000;

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get("transactionId");
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId es requerido" },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      const order = await prisma.order.findFirst({
        where: { transactionId },
      });
      let status = order?.wompiStatus ?? "PENDING";

      if (order?.paymentProvider === "WOMPI" && status !== "APPROVED") {
        const elapsed = Date.now() - new Date(order.createdAt).getTime();
        if (elapsed >= 8000) {
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
    } else if (wompiTx.data.status === "DECLINED") {
      await prisma.order.updateMany({
        where: { transactionId },
        data: { status: "rechazado" },
      });
    } else if (wompiTx.data.status === "ERROR") {
      await prisma.order.updateMany({
        where: { transactionId },
        data: { status: "error" },
      });
    }

    return NextResponse.json({ transaction: wompiTx.data });
  } catch (error) {
    console.error("nequi/status error:", error);
    return NextResponse.json(
      { error: "Error al verificar transacción" },
      { status: 500 }
    );
  }
}
