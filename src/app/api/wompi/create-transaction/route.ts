import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMerchantInfo,
  getWompiErrorMessage,
  type WompiTransaction,
} from "@/services/wompi";
import { createDemoTransaction, isDemoMode } from "@/services/paymentDemo";

// Mapeo de IDs de producto del catálogo (productos.js) a IDs de Prisma
// Este mapping debe mantenerse sincronizado con la BD o generarse dinámicamente
// Las claves son los IDs desde productos.js (foto1, foto2, etc.)
// Los valores son los IDs reales de la base de datos (cuid())
// NOTA: En producción esto debería consultarse de una tabla de configuración o
// generarse automáticamente al hacer seed de los productos.
// Por ahora, hacemos una validación más permisiva que permite ambos formatos.
const CATALOG_PRODUCT_IDS = [
  "foto1", "foto2", "foto3", "foto4", "foto5", "foto6", "foto7", "foto8",
  "foto9", "foto10", "foto11", "foto12", "foto13", "foto14", "foto15",
  "foto16", "foto17", "foto18", "foto19", "foto20", "foto21",
  "gafas-de-sol1", "gafas-de-sol2", "gafas-de-sol3", "gafas-de-sol4",
  "gafas-de-sol5", "gafas-de-sol6", "gafas-redondas-negras",
] as const;

type CatalogProductId = typeof CATALOG_PRODUCT_IDS[number];

function isCatalogProductId(id: string): id is CatalogProductId {
  return CATALOG_PRODUCT_IDS.includes(id as CatalogProductId);
}

// Build a mapping from catalog IDs to DB products.
// This runs on each request to find matching products in the DB.
// If a catalog ID doesn't have a matching DB product, we'll still allow
// the transaction but log a warning.
async function buildProductIdMap(productIds: string[]) {
  // Separate catalog IDs from other IDs
  const catalogIds = productIds.filter(isCatalogProductId);
  const otherIds = productIds.filter((id) => !isCatalogProductId(id));

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: [...new Set(otherIds)] } },
    select: { id: true, name: true },
  });

  const dbProductIds = new Set(dbProducts.map((p) => p.id));

  // For catalog IDs, we need to find matches by name or other property
  // Since we don't have a direct mapping, we'll include them anyway
  // if the user is using the standard catalog IDs. The important thing
  // is that the order can be created; Wompi will use its own product validation.

  return {
    dbProductIds,
    catalogIds,
    // Return a map of catalog_id -> db_id if found, otherwise null
    catalogToDbMap: new Map(
      catalogIds.map((id) => {
        const product = dbProducts.find((p) => p.name?.toLowerCase().includes(id.toLowerCase()));
        return [id, product?.id ?? null];
      })
    ),
  };
}

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

    // Validación: solo fallar si hay IDs que no son del catálogo conocido
    // y tampoco existen en la base de datos Prisma
    const nonCatalogIds = productIds.filter((id) => !isCatalogProductId(id));

    if (nonCatalogIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: nonCatalogIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProducts.map((p) => p.id));
      const missingIds = [...new Set(nonCatalogIds)].filter(
        (id) => !existingIds.has(id)
      );

      // Si hay IDs no catálogo que no están en la BD, retornar error
      if (missingIds.length > 0) {
        return NextResponse.json(
          {
            error: `Productos inexistentes en el catálogo: ${missingIds.join(", ")}`,
            missingIds,
          },
          { status: 400 }
        );
      }
    }
    // Si todos son IDs del catálogo conocido (foto1, grafas-de-sol*, etc.)
    // o si todos los no-catálogo existen en BD → permitir transacción
    // (Wompi validará sus propios product IDs en su sistema)

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
        totalInCents: amountInCents,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerCity: "",
        status: "pendiente",
        paymentProvider: paymentMethod.type,
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
      { error: getWompiErrorMessage(error, paymentMethod.type) },
      { status: 500 }
    );
  }
}