import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
  getWompiErrorMessage,
} from "@/services/wompi";
import { isDemoMode, createDemoTransaction } from "@/services/paymentDemo";

type PaymentMethodType = "NEQUI" | "ADDI" | "SISTECREDITO";

export async function POST(req: Request) {
  try {
    const { customerId, items, paymentMethod, customerInfo } = (await req.json()) as {
      customerId: string;
      items: { productId: string; quantity: number; price: number }[];
      paymentMethod: { type: PaymentMethodType };
      customerInfo: {
        email: string;
        full_name: string;
        phone_number?: string;
        legal_id?: string;
        legal_id_type?: string;
      };
    };

    if (!customerId || !items?.length || !paymentMethod?.type || !customerInfo) {
      return Response.json(
        { error: "Faltan campos requeridos: customerId, items, paymentMethod, customerInfo" },
        { status: 400 }
      );
    }

    // Monto SIEMPRE calculado en el servidor
    let totalCents = 0;
    const serverItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const producto = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!producto) {
        return Response.json(
          { error: `Producto ${item.productId} no existe en la base de datos` },
          { status: 400 }
        );
      }
      const itemTotalCents = producto.price * 100 * item.quantity;
      totalCents += itemTotalCents;
      // Usar precio del servidor, nunca del cliente
      serverItems.push({
        productId: producto.id,
        quantity: item.quantity,
        price: producto.price,
      });
    }

    // Referencia única para Wompi (max 255 chars)
    const referencia = `OPM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Crear la orden en la BD
    const orden = await prisma.order.create({
      data: {
        customerId,
        customerName: customerInfo.full_name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone_number ?? "",
        customerCity: "",
        paymentReference: referencia,
        totalInCents: totalCents / 100,
        status: "PENDING",
        paymentProvider: paymentMethod.type === "NEQUI" ? "Wompi" : paymentMethod.type,
        items: {
          create: serverItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // ADDI / SISTECREDITO: flujo manual por WhatsApp (nunca llama a Wompi)
    if (paymentMethod.type === "ADDI" || paymentMethod.type === "SISTECREDITO") {
      return Response.json({
        transactionId: null,
        nequiQrUrl: null,
        orderId: orden.id,
        referencia,
        amountInCents: totalCents,
        status: "PENDING",
        requiresWhatsApp: true,
        paymentMethod: paymentMethod.type,
      });
    }

    // NEQUI: verificar modo demo vs producción
    if (isDemoMode()) {
      // Modo demo: crear transacción ficticia
      const demoResult = createDemoTransaction({
        amountInCents: totalCents,
        reference: referencia,
        paymentMethod: { type: "NEQUI" },
        demoPagoUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/demo/pago`,
      });

      // Guardar transactionId demo en la orden
      await prisma.order.update({
        where: { id: orden.id },
        data: {
          transactionId: demoResult.data.id,
          wompiStatus: "PENDING",
        },
      });

      return Response.json({
        transactionId: demoResult.data.id,
        nequiQrUrl: demoResult.data.nequiQrUrl,
        orderId: orden.id,
        referencia,
        amountInCents: totalCents,
        status: "PENDING",
      });
    }

    // Producción: crear transacción real en Wompi
    if (!customerInfo.phone_number) {
      return Response.json(
        { error: "Nequi requiere número de teléfono" },
        { status: 400 }
      );
    }

    const merchant = await getMerchantInfo();

    const txResult = await createTransaction({
      amountInCents: totalCents,
      reference: referencia,
      customer: {
        email: customerInfo.email,
        full_name: customerInfo.full_name,
        phone_number: customerInfo.phone_number,
        legal_id: customerInfo.legal_id,
        legal_id_type: customerInfo.legal_id_type,
      },
      acceptanceToken: merchant.data.presigned_acceptance.acceptance_token,
      acceptPersonalAuth:
        merchant.data.presigned_personal_data_auth.personal_data_auth_token,
      paymentMethod: { type: "NEQUI" },
    });

    // Guardar transactionId en la orden
    await prisma.order.update({
      where: { id: orden.id },
      data: {
        transactionId: txResult.data.id,
        wompiStatus: txResult.data.status,
      },
    });

    return Response.json({
      transactionId: txResult.data.id,
      nequiQrUrl: txResult.data.nequiQrUrl,
      orderId: orden.id,
      referencia,
      amountInCents: totalCents,
      status: txResult.data.status,
    });
  } catch (error) {
    console.error("create-transaction error:", error);
    const message = getWompiErrorMessage(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
