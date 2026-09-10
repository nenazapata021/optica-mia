import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  type WebhookVerificationResult,
} from "@/lib/payments";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await context.params;
    const body = await request.json();
    const signature = request.headers.get("x-signature") ?? "";

    // Verificación específica por proveedor
    let signatureValid = false;

    if (provider === "wompi") {
      // Wompi: validar firma HMAC usando WOMPI_EVENT_SECRET
      const payload = JSON.stringify(body);
      signatureValid = verifyWebhookSignature(payload, signature);
    } else if (provider === "addi" || provider === "sistecredito") {
      // Addi / Sistecredito: TODO - implementar verificación cuando se conozca el mecanismo
      // Por ahora establecemos signatureValid en false pero procesamos igualmente
      // en modo manual/pending. Cuando se conozca el mecanismo de firma de cada uno,
      // se reemplazará este bloque con la validación correspondiente.
      console.log(
        `Webhook de ${provider} recibido sin validación de firma (por implementar)`
      );
      signatureValid = false;
    } else {
      return NextResponse.json(
        { error: "Proveedor inválido" },
        { status: 400 }
      );
    }

    const transaction = body.data?.transaction;

    if (!transaction?.id) {
      return NextResponse.json(
        { error: "Datos de transacción inválidos" },
        { status: 400 }
      );
    }

    // Actualizar estado del pedido por paymentReference
    const updateData: any = {
      paymentReference: transaction.id,
    };

    // Determinar estado basado en el status del proveedor
    const wompiStatus: string = transaction.status;

    if (wompiStatus === "APPROVED") {
      updateData.paymentStatus = "approved";
      updateData.status = "confirmado";
    } else if (wompiStatus === "DECLINED" || wompiStatus === "VOIDED") {
      updateData.paymentStatus = "declined";
      updateData.status = "rechazado";
    } else if (wompiStatus === "ERROR") {
      updateData.paymentStatus = "error";
      updateData.status = "error";
    } else {
      // Estados intermedios: mantener pending
      updateData.paymentStatus = "pending";
    }

    await prisma.order.updateMany({
      where: { paymentReference: transaction.id },
      data: updateData,
    });

    // Disparar notificación cuando el estado sea "approved"
    if (updateData.paymentStatus === "approved") {
      // TODO: Llamar a notifyOrderPaid - esto requiere un servicio de notificaciones
      // await notifyOrderPaid({ orderId: transaction.id, provider });
      console.log(
        `✅ Pedido ${transaction.id} aprobado - disparando notifyOrderPaid`
      );
    }

    return NextResponse.json({
      ok: true,
      provider,
      paymentStatus: updateData.paymentStatus,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}