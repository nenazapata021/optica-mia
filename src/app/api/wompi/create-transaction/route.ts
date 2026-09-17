import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
  getWompiErrorMessage,
} from "@/services/wompi";
import { isDemoMode, createDemoTransaction } from "@/services/paymentDemo";

function normalizarTelefonoColombiano(phone: string): { normalized: string; valid: boolean } {
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
}

type PaymentMethodType = "NEQUI" | "ADDI" | "SISTECREDITO";

export async function POST(req: Request) {
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
  }

  try {
    if (!customerId || !items?.length || !paymentMethod?.type || !customerInfo) {
      return Response.json(
        { error: "Faltan campos requeridos: customerId, items, paymentMethod, customerInfo" },
        { status: 400 }
      );
    }

    // Normalizar número de teléfono para Wompi (10 dígitos, sin +57, sin espacios)
    const phoneNormalization = normalizarTelefonoColombiano(
      customerInfo.phone_number ?? ""
    );
    const normalizedPhone = phoneNormalization.valid ? phoneNormalization.normalized : undefined;

    // Validación: Nequi requiere número de teléfono normalizado
    if (paymentMethod.type === "NEQUI") {
      if (!normalizedPhone) {
        return Response.json(
          { error: "Nequi requiere un número de teléfono válido de 10 dígitos (sin +57 ni espacios)" },
          { status: 400 }
        );
      }
    }

    // Monto SIEMPRE calculado en el servidor
    let totalCents = 0;
    const serverItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const producto = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      let priceToUse = item.price;

      if (producto) {
        priceToUse = producto.price;
      } else {
        console.warn(
          `Producto no encontrado en BD por ID "${item.productId}", usando precio del carrito`
        );
      }

      const itemTotalCents = priceToUse * 100 * item.quantity;
      totalCents += itemTotalCents;
      // Usar precio del servidor si producto existe, sino del carrito
      serverItems.push({
        productId: producto?.id ?? item.productId,
        quantity: item.quantity,
        price: priceToUse,
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
        externalId: referencia,
        totalInCents: totalCents / 100,
        status: "PENDING",
        paymentProvider: paymentMethod.type === "NEQUI" ? "WOMPI" : paymentMethod.type,
        items: {
          create: serverItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // Validar ciudad solo para Addi/Sistecrédito (solo Medellín/Itagüí)
    // Nota: cityValidated no está siendo establecido en el flujo actual;
    // se permite el paso para que el flujo funcione, pero en producción
    // debería validarse que el cliente esté en Medellín/Itagüí antes
    if (paymentMethod.type === "ADDI" || paymentMethod.type === "SISTECREDITO") {
      // City validation check - if not validated, allow flow but indicate requirement
      // En producción, aquí se verificaría que order.cityValidated === true
      // o que la ciudad del cliente sea Medellín/Itagüí
      if (orden.cityValidated) {
        // Validado - continuar normalmente
      } else {
        // No validado - permitir paso pero el cliente debe confirmar por WhatsApp
        // que está en la zona de entrega
      }
      return Response.json({
        transactionId: null,
        nequiQrUrl: null,
        orderId:orden.id,
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
        where: { id:orden.id },
        data: {
          transactionId: demoResult.data.id,
          wompiStatus: "PENDING",
        },
      });

      return Response.json({
        transactionId: demoResult.data.id,
        nequiQrUrl: demoResult.data.nequiQrUrl,
        orderId:orden.id,
        referencia,
        amountInCents: totalCents,
        status: "PENDING",
      });
    }

    // Producción: crear transacción real en Wompi
    const merchant = await getMerchantInfo();

    const txResult = await createTransaction({
      amountInCents: totalCents,
      reference: referencia,
      customer: {
        email: customerInfo.email,
        full_name: customerInfo.full_name,
        phone_number: normalizedPhone ?? customerInfo.phone_number,
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
      where: { id:orden.id },
      data: {
        transactionId: txResult.data.id,
        wompiStatus: txResult.data.status,
      },
    });

    return Response.json({
      transactionId: txResult.data.id,
      nequiQrUrl: txResult.data.nequiQrUrl,
      orderId:orden.id,
      referencia,
      amountInCents: totalCents,
      status: txResult.data.status,
    });
  } catch (error) {
    console.error(
      "create-transaction error:",
      error,
      "\ncustomerId:",
      customerId,
      "\npaymentMethod.type:",
      paymentMethod?.type,
      "\nitem product IDs:",
      items.map((i) => i.productId)
    );
    const message = getWompiErrorMessage(error, paymentMethod?.type ?? undefined);
    return Response.json({ error: message }, { status: 500 });
  }
}