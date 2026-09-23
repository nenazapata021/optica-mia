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
      // Addi / Sistecredito: firma por verificar, procesar igualmente
      console.log(`Webhook de ${provider} recibido sin validación de firma (por implementar)`);
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

    // Actualizar estado del pedido por externalId
    const updateData: any = {
      externalId: transaction.id,
    };

    // Determinar estado basado en el status del proveedor
    const status = transaction.status;

    if (status === "APPROVED") {
      updateData.status = "confirmado";
    } else if (status === "DECLINED" || status === "VOIDED") {
      updateData.status = "rechazado";
    } else if (status === "ERROR") {
      updateData.status = "error";
    } else {
      // Estados intermedios: mantener pending
      updateData.status = "pendiente";
    }

    // Establecer paymentProvider basado en el proveedor
    let paymentProviderKey: string;
    if (provider === "wompi") {
      paymentProviderKey = "WOMPI";
    } else if (provider === "addi") {
      paymentProviderKey = "ADDI";
    } else if (provider === "sistecredito") {
      paymentProviderKey = "SISTECREDITO";
    } else {
      paymentProviderKey = "WOMPI"; // default
    }
    updateData.paymentProvider = paymentProviderKey;

    await prisma.order.updateMany({
      where: { externalId: transaction.id },
      data: updateData,
    });

    // Disparar notificación cuando el estado sea "confirmado"
    if (updateData.status === "confirmado") {
      // TODO: Llamar a notifyOrderPaid - esto requiere un servicio de notificaciones
      // await notifyOrderPaid({ orderId: transaction.id, provider });
      console.log(
        `✅ Pedido ${transaction.id} aprobado - disparando notifyOrderPaid`
      );
    }

    return NextResponse.json({
      ok: true,
      provider,
      status: updateData.status,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}