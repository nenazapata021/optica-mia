// TODO: Este endpoint está deshabilitado temporalmente.
// Se debe reconectar cuando se tengan las credenciales reales de Sistecredito.
// Por ahora, el flujo de Sistecredito se maneja por WhatsApp (ver WhatsAppCheckoutModal).
// La creación de pedidos PENDING se realiza en /api/wompi/create-transaction.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sistecreditoBaseUrl = process.env.SISTECREDITO_API_BASE_URL ?? "https://api.sistecredito.co";
const sistecreditoClientId = process.env.SISTECREDITO_CLIENT_ID ?? "";
const sistecreditoClientSecret = process.env.SISTECREDITO_CLIENT_SECRET ?? "";
const sistecreditoEnv = process.env.SISTECREDITO_ENV ?? "sandbox";

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
    const reference = `SIS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Crear transacción en Sistecrédito
    let data;
    let checkoutUrl;

    // Modo sandbox: usar link manual (pending integración API real)
    if (sistecreditoEnv === "sandbox") {
      // En sandbox, generar link manual por ahora
      checkoutUrl = `/manual-sistecredito-payment?reference=${reference}&amount=${totalCents}`;
      data = {
        data: {
          approval_url: checkoutUrl,
          reference,
          status: "pending",
        },
      };
    } else {
      // Producción: llamada real a API de Sistecrédito
      const res = await fetch(`${sistecreditoBaseUrl}/v1/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sistecreditoClientSecret}`,
        },
        body: JSON.stringify({
          amount: totalCents,
          currency: "COP",
          reference,
          customer: {
            email: customer.email,
            full_name: customer.full_name,
            phone_number: customer.phone_number,
          },
          redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/carrito`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return Response.json(
          { error: errorData.detail || "Error al crear transacción Sistecrédito" },
          { status: 500 }
        );
      }

      const result = await res.json();
      data = result.data;
      checkoutUrl = result.data?.checkout_url;
    }

    // Crear la orden en la BD con paymentProvider = "SISTECREDITO"
    const orden = await prisma.order.create({
      data: {
        customerId: customer.email,
        customerName: customer.full_name,
        customerEmail: customer.email,
        customerPhone: customer.phone_number ?? "",
        customerCity: "",
        paymentProvider: "SISTECREDITO",
        // $expectedBy$: typescript-prisma
        externalId: data?.data?.id || reference,
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
      transactionId: data?.data?.id || reference,
      checkoutUrl,
      orderId: orden.id,
      referencia: reference,
      amountInCents: totalCents,
      status: data?.data?.status ?? "pending",
      paymentProvider: "SISTECREDITO",
    });
  } catch (error) {
    console.error("sistecredito create-transaction error:", error);
    return Response.json(
      { error: "Error interno al crear transacción Sistecrédito" },
      { status: 500 }
    );
  }
}