import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
} from "@/src/services/wompi";

export async function POST(request: Request) {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      customerInfo,
    } = await request.json();

    if (!customerId || !items?.length || !paymentMethod) {
      return NextResponse.json(
        { error: "customerId, items y paymentMethod requeridos" },
        { status: 400 }
      );
    }

    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const amountInCents = Math.round(total);

    const reference = `MIA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    let acceptanceToken: string | undefined;
    try {
      const merchant = await getMerchantInfo();
      acceptanceToken =
        merchant.data.presigned_acceptance?.acceptance_token;
    } catch {
      // acceptance token no es crítico para transacciones de un solo paso
    }

    const wompiTx = await createTransaction({
      amountInCents,
      reference,
      customer: {
        email: customerInfo.email,
        full_name: customerInfo.full_name,
        phone_number: customerInfo.phone_number,
        legal_id: customerInfo.legal_id,
        legal_id_type: customerInfo.legal_id_type ?? "CC",
      },
      paymentMethod,
    });

    const order = await prisma.order.create({
      data: {
        customerId,
        total: amountInCents,
        status: "pendiente",
        paymentMethod: paymentMethod.type,
        transactionId: wompiTx.data.id,
        wompiStatus: wompiTx.data.status,
        items: {
          create: items.map(
            (item: { productId: string; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })
          ),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        transaction: wompiTx.data,
        acceptanceToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wompi create-transaction error:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
