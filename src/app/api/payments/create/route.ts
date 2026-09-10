import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateWebCheckoutSignature,
  createWebCheckout,
} from "@/lib/payments/wompi";
import { addi, sistecredito } from "@/lib/payments";

const PROVIDERS = {
  wompi: {
    name: "Wompi" as const,
    createCheckout: async (order: {
      totalInCents: number;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerCity: string;
      orderId: string;
    }): Promise<{ checkoutUrl: string; paymentReference: string }> => {
      const reference = `MIA-${Date.now()}-${order.orderId.slice(-8).toUpperCase()}`;
      const amountInCents = order.totalInCents;

      // Obtener tokens de aceptación de Wompi merchant
      const merchantRes = await fetch(
        `${process.env.WOMPI_API_URL}/merchants/${process.env.WOMPI_PUBLIC_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          },
        }
      );
      const merchantData = await merchantRes.json();
      const acceptanceToken =
        merchantData.data.presigned_acceptance?.acceptance_token;
      const personalAuthToken =
        merchantData.data.presigned_personal_data_auth
          ?.personal_data_auth_token;

      if (!acceptanceToken || !personalAuthToken) {
        throw new Error(
          "No se pudo obtener la aceptación de términos de Wompi"
        );
      }

      const { checkoutUrl, paymentReference } = await createWebCheckout({
        reference,
        amountInCents,
        customer: {
          email: order.customerEmail,
          full_name: order.customerName,
          phone_number: order.customerPhone,
        },
        paymentMethod: "ADDI",
        acceptanceToken,
        personalAuthToken,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      });

      return { checkoutUrl, paymentReference };
    },
  },
  addi: {
    name: "Addi" as const,
    createCheckout: async (): Promise<{
      checkoutUrl: string;
      paymentReference: string;
    }> => {
      // Modo manual: generar link desde panel de comercio
      // El provider se pasa al llamar getManualLink, pero aquí usamos el método estático
      const manualLink = addi.getManualLink("addi");
      return {
        checkoutUrl: manualLink,
        paymentReference: "", // Se llenará con el orderId en el frontend
      };
    },
  },
  sistecredito: {
    name: "Sistecredito" as const,
    createCheckout: async (): Promise<{
      checkoutUrl: string;
      paymentReference: string;
    }> => {
      // Modo manual: generar link desde panel de comercio
      const manualLink = sistecredito.getManualLink("sistecredito");
      return {
        checkoutUrl: manualLink,
        paymentReference: "",
      };
    },
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

export async function POST(request: Request) {
  try {
    const { provider, orderId }: { provider: string; orderId: string } =
      await request.json();

    if (!provider || !orderId) {
      return NextResponse.json(
        { error: "provider y orderId son requeridos" },
        { status: 400 }
      );
    }

    // 1. Obtener el pedido real desde Prisma (nunca confiar en el monto que venga del frontend)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 2. Validar que cityValidated sea true antes de proceder
    if (!order.cityValidated) {
      return NextResponse.json(
        {
          error:
            "La ciudad del cliente no ha sido validada para entrega (solo Medellín/Itagüí)",
        },
        { status: 400 }
      );
    }

    // 3. Dispatch al proveedor correspondiente
    const providerKey = provider as ProviderKey;
    const providerConfig = PROVIDERS[providerKey];

    if (!providerConfig) {
      return NextResponse.json(
        { error: `Proveedor ${provider} no soportado` },
        { status: 400 }
      );
    }

    let result: { checkoutUrl: string; paymentReference: string };

    if (providerKey === "wompi") {
      result = await PROVIDERS.wompi.createCheckout({
        totalInCents: order.totalInCents,
        customerName: order.customerName ?? "",
        customerEmail: order.customerEmail ?? "",
        customerPhone: order.customerPhone ?? "",
        customerCity: order.customerCity ?? "",
        orderId: order.id,
      });
    } else if (providerKey === "addi") {
      // Modo manual: el link viene desde el panel de comercio
      result = await PROVIDERS.addi.createCheckout();
    } else if (providerKey === "sistecredito") {
      result = await PROVIDERS.sistecredito.createCheckout();
    } else {
      return NextResponse.json(
        { error: "Proveedor no válido" },
        { status: 400 }
      );
    }

    // 4. Guardar campos de pago en la orden
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProvider: providerKey,
        paymentReference: result.paymentReference || order.id,
        paymentStatus: "pending",
      },
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      paymentReference: result.paymentReference || order.id,
      provider: providerKey,
    });
  } catch (error) {
    console.error("Error en create-payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}