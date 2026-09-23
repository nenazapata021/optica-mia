import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WOMPI_EVENT_SECRET = process.env.WOMPI_EVENT_SECRET ?? "";

function verifyWompiWebhook(body: Record<string, unknown>): boolean {
  if (!WOMPI_EVENT_SECRET) {
    console.error("[SECURITY] WOMPI_EVENT_SECRET no configurado — webhook rechazado (fail-closed)");
    return false;
  }

  const signature = body.signature as
    | { properties: string[]; checksum: string }
    | undefined;
  if (!signature?.properties || !signature?.checksum) return false;

  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return false;

  // Concatenar valores de signature.properties + timestamp + eventSecret
  const parts: string[] = [];
  for (const prop of signature.properties) {
    // "transaction.id" -> data.transaction.id
    const keys = prop.split(".");
    let value: unknown = data;
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key];
    }
    parts.push(String(value ?? ""));
  }

  const timestamp = (body.timestamp as number) ?? (body.sent_at as number) ?? "";
  parts.push(String(timestamp));
  parts.push(WOMPI_EVENT_SECRET);

  const expected = crypto
    .createHash("sha256")
    .update(parts.join(""))
    .digest("hex");

  return signature.checksum.toUpperCase() === expected.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!verifyWompiWebhook(body)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const transaction = body.data?.transaction as Record<string, unknown> | undefined;

    if (!transaction?.id) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const wompiStatus = transaction.status as string;
    let orderStatus = "pendiente";

    if (wompiStatus === "APPROVED") {
      orderStatus = "confirmado";
    } else if (wompiStatus === "DECLINED" || wompiStatus === "VOIDED") {
      orderStatus = "rechazado";
    } else if (wompiStatus === "ERROR") {
      orderStatus = "error";
    }

    await prisma.order.updateMany({
      where: { transactionId: transaction.id as string },
      data: {
        wompiStatus,
        status: orderStatus,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
