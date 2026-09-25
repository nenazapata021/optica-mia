import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
  getWompiErrorMessage,
} from "@/services/wompi";
import { isDemoMode, createDemoTransaction } from "@/services/paymentDemo";

export async function POST(request: Request) {
  try {
    const { orderId, customerInfo } = (await request.json()) as {
      orderId: string;
      customerInfo: {
        email: string;
        full_name: string;
        phone_number?: string;
      };
    };

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId es requerido" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const totalInCents = order.totalInCents * 100;
    const referencia = `OPM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const phone = customerInfo?.phone_number ?? order.customerPhone ?? "";

    if (isDemoMode()) {
      const demoResult = createDemoTransaction({
        amountInCents: totalInCents,
        reference: referencia,
        paymentMethod: { type: "NEQUI" },
        demoPagoUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/demo/pago`,
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          transactionId: demoResult.data.id,
          externalId: referencia,
          wompiStatus: "PENDING",
          paymentProvider: "WOMPI",
          paymentMethod: "NEQUI",
        },
      });

      return NextResponse.json({
        transactionId: demoResult.data.id,
        nequiQrUrl: demoResult.data.nequiQrUrl,
        orderId,
        referencia,
        amountInCents: totalInCents,
        status: "PENDING",
      });
    }

    const phoneNormalization = (() => {
      if (!phone) return { normalized: "", valid: false };
      const cleaned = phone.replace(/\s|-|\(|\)/g, "");
      if (cleaned.startsWith("+57")) {
        const digits = cleaned.slice(3);
        if (digits.length === 10) return { normalized: digits, valid: true };
      }
      if (cleaned.length === 10) return { normalized: cleaned, valid: true };
      if (cleaned.length === 11 && cleaned.startsWith("3")) {
        const digits = cleaned.slice(1);
        if (digits.length === 10) return { normalized: digits, valid: true };
      }
      return { normalized: "", valid: false };
    })();

    if (!phoneNormalization.valid) {
      return NextResponse.json(
        { error: "Nequi requiere un número de teléfono válido de 10 dígitos" },
        { status: 400 }
      );
    }

    const merchant = await getMerchantInfo();

    const txResult = await createTransaction({
      amountInCents: totalInCents,
      reference: referencia,
      customer: {
        email: customerInfo?.email ?? order.customerEmail,
        full_name: customerInfo?.full_name ?? order.customerName,
        phone_number: phoneNormalization.normalized,
      },
      acceptanceToken: merchant.data.presigned_acceptance.acceptance_token,
      acceptPersonalAuth:
        merchant.data.presigned_personal_data_auth.personal_data_auth_token,
      paymentMethod: { type: "NEQUI" },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId: txResult.data.id,
        externalId: referencia,
        wompiStatus: txResult.data.status,
        paymentProvider: "WOMPI",
        paymentMethod: "NEQUI",
      },
    });

    return NextResponse.json({
      transactionId: txResult.data.id,
      nequiQrUrl: txResult.data.nequiQrUrl,
      orderId,
      referencia,
      amountInCents: totalInCents,
      status: txResult.data.status,
    });
  } catch (error) {
    console.error("nequi/create error:", error);
    const message = getWompiErrorMessage(error, "NEQUI");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
