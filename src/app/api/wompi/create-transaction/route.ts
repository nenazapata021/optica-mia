import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
  getWompiErrorMessage,
  type WompiTransaction,
} from "@/services/wompi";
import { createDemoTransaction, isDemoMode } from "@/services/paymentDemo";

export async function POST(request: Request) {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      customerInfo,
    }: {
      customerId: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      paymentMethod:
        | { type: "NEQUI" }
        | { type: "ADDI"; installments?: number }
        | { type: "SISTECREDITO" };
      customerInfo: {
        email: string;
        full_name: string;
        phone_number?: string;
        legal_id?: string;
        legal_id_type?: string;
      };
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
    const amountInCents = Math.round(total * 100);

    const productIds = items.map((item: { productId: string }) => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    const missingIds = [...new Set(productIds)].filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: `Productos inexistentes en el catálogo: ${missingIds.join(", ")}`,
          missingIds,
        },
        { status: 400 }
      );
    }

    const reference = `MIA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const requestUrl = new URL(request.url);
    const redirectUrl = `${requestUrl.origin}/carrito`;

    let wompiTx: { data: WompiTransaction };
    let acceptanceToken: string | null = null;

    if (isDemoMode()) {
      wompiTx = createDemoTransaction({
        amountInCents,
        reference,
        paymentMethod,
        demoPagoUrl: `${requestUrl.origin}/demo/pago`,
      });
    } else {
      const merchant = await getMerchantInfo();
      const acceptance = merchant.data.presigned_acceptance?.acceptance_token;
      const personalAuth =
        merchant.data.presigned_personal_data_auth?.personal_data_auth_token;

      if (!acceptance || !personalAuth) {
        return NextResponse.json(
          { error: "No se pudo obtener la aceptación de términos de Wompi" },
          { status: 502 }
        );
      }
      acceptanceToken = acceptance;

      wompiTx = await createTransaction({
        amountInCents,
        reference,
        customer: {
          email: customerInfo.email,
          full_name: customerInfo.full_name,
          phone_number: customerInfo.phone_number,
          legal_id: customerInfo.legal_id,
          legal_id_type: customerInfo.legal_id_type ?? "CC",
        },
        acceptanceToken: acceptance,
        acceptPersonalAuth: personalAuth,
        paymentMethod,
        redirectUrl,
      });
    }

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
      { error: getWompiErrorMessage(error) },
      { status: 500 }
    );
  }
}
