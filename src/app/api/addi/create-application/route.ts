// TODO: Este endpoint está deshabilitado temporalmente.
// Se debe reconectar cuando se tengan las credenciales reales de Addi.
// Por ahora, el flujo de Addi se maneja por WhatsApp (ver WhatsAppCheckoutModal).
// La creación de pedidos PENDING se realiza en /api/wompi/create-transaction.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const addiBaseUrl = process.env.ADDI_API_BASE_URL ?? "https://api.addi.mx";
const addiClientId = process.env.ADDI_CLIENT_ID ?? "";
const addiClientSecret = process.env.ADDI_CLIENT_SECRET ?? "";
const addiEnv = process.env.ADDI_ENV ?? "sandbox";

export async function POST(request: Request) {
  try {
    const { customer, items, paymentMethod, customerInfo } = (await request.json()) as {
      customer: { email: string; full_name: string; phone_number?: string };
      items: { productId: string; quantity: number; price: number }[];
      paymentMethod: { type: string };
      customerInfo: {
        email: string;
        full_name: string;
        phone_number?: string;
        legal_id?: string;
        legal_id_type?: string;
      };
    };

    if (!customer?.email || !customer?.full_name || !items?.length) {
      return Response.json(
        { error: "Faltan campos requeridos: customer, items" },
        { status: 400 }
      );
    }

    // Calcular monto total en céntimos
    let totalCents = 0;
    for (const item of items) {
      totalCents += item.price * 100 * item.quantity;
    }

    // Referencia única
    const reference = `ADDI-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    // Modo sandbox: redirect directamente a WhatsApp (flujo manual)
    const whatsappPhone = "573017391219";
    const whatsappMessage = `
Hola, quiero comprar con Addi.
Cliente: ${customerInfo.full_name || customer.full_name}
Número de pedido: pending
Productos: ${items.map((item) => `- ${item.productId} x${item.quantity}`).join("\n")}
Total: $${totalCents.toLocaleString("es-CO")}
`;

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    // Crear la orden en la BD con paymentProvider = "ADDI"
    const orden = await prisma.order.create({
      data: {
        userId: user?.id || customer.email,
        customerName: customer.full_name,
        customerEmail: customer.email,
        customerPhone: customer.phone_number ?? "",
        customerCity: "",
        paymentProvider: "ADDI",
        paymentMethod: paymentMethod?.type,
        externalId: reference,
        totalInCents: totalCents / 100,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    return Response.json({
      transactionId: reference,
      checkoutUrl: whatsappUrl,
      orderId: orden.id,
      referencia: reference,
      amountInCents: totalCents,
      status: "pending",
      paymentProvider: "ADDI",
      whatsappUrl: whatsappUrl,
      requiresWhatsApp: true,
    });
  } catch (error) {
    console.error("addi create-application error:", error);
    return Response.json(
      { error: "Error interno al crear aplicación Addi" },
      { status: 500 }
    );
  }
}