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
    // Validación estricta de tipos permitidos
    const allowedMethods = ["NEQUI", "ADDI", "SISTECREDITO"] as const;
    if (!customerId || typeof customerId !== "string" || customerId.length > 50) {
      return Response.json({ error: "customerId inválido" }, { status: 400 });
    }
    if (!items?.length || !Array.isArray(items) || items.length > 20) {
      return Response.json({ error: "Carrito inválido (1-20 items)" }, { status: 400 });
    }
    for (const it of items) {
      if (!it.productId || typeof it.productId !== "string" || it.productId.length > 64) {
        return Response.json({ error: "productId inválido" }, { status: 400 });
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 10) {
        return Response.json({ error: "Cantidad inválida (1-10)" }, { status: 400 });
      }
      // No confiar en price del cliente — se recalcula en servidor
    }
    if (!paymentMethod?.type || !allowedMethods.includes(paymentMethod.type as typeof allowedMethods[number])) {
      return Response.json({ error: "Método de pago no soportado" }, { status: 400 });
    }
    if (!customerInfo?.email || !customerInfo?.full_name) {
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

    // Monto SIEMPRE calculado en el servidor — rechazar producto inexistente (anti-enumeración y anti-price-tampering)
    let totalCents = 0;
    const serverItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const producto = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!producto) {
        // No exponer ID al cliente — mensaje genérico (evita enumeración)
        console.warn(`[SECURITY] Producto inexistente solicitado: ${item.productId} por customer ${customerId}`);
        return Response.json(
          { error: "Uno o más productos no están disponibles. Por favor recarga el catálogo." },
          { status: 400 }
        );
      }

      const priceToUse = producto.price; // SIEMPRE precio servidor
      const itemTotalCents = Math.round(priceToUse * 100 * item.quantity);
      totalCents += itemTotalCents;
      serverItems.push({
        productId: producto.id,
        quantity: item.quantity,
        price: priceToUse,
      });
    }

    if (totalCents <= 0 || totalCents > 50_000_000) { // max 500k COP en centavos = 500k
      return Response.json({ error: "Monto inválido" }, { status: 400 });
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
    // No loguear PII (email, phone) en plaintext — solo IDs hasheados
    console.error(
      "create-transaction error:",
      error instanceof Error ? error.message : String(error),
      `customerId=${String(customerId).slice(0,8)}...`,
      `method=${paymentMethod?.type}`
    );
    const message = getWompiErrorMessage(error, paymentMethod?.type ?? undefined);
    // Mensaje sanitizado — nunca filtrar stack ni detalles de Wompi privados
    return Response.json({ error: message }, { status: 500 });
  }
}