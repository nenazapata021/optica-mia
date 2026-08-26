import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customerId = formData.get("customerId") as string | null;

    if (!customerId) {
      return NextResponse.json({ error: "customerId es requerido (email único)." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Archivo no recibido." }, { status: 400 });
    }

    // Validar tipo PNG (salida del procesador)
    if (file.type !== "image/png") {
      return NextResponse.json({ error: "La imagen procesada debe ser PNG." }, { status: 400 });
    }

    // Validar customer existe
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer no encontrado. Verifica el email único." }, { status: 404 });
    }

    // Generar nombre único: uuid + timestamp (evita colisiones) - bucket "client-photos"
    const storageKey = `${crypto.randomUUID()}-${Date.now()}.png`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const sizeBytes = buffer.length;

    // 1024x1024 ya viene validado en cliente, aquí solo persistimos
    const url = `/api/client-photos/${storageKey}`;

    await prisma.clientPhoto.create({
      data: {
        storageKey,
        url,
        mimeType: "image/png",
        sizeBytes,
        width: 1024,
        height: 1024,
        data: buffer,
        customerId,
      },
    });

    return NextResponse.json({ url, storageKey, sizeBytes }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/client-photos] Error:", error);
    // Prisma unique constraint o BYTEA error
    return NextResponse.json({ error: "No se pudo guardar en PostgreSQL. Intenta de nuevo." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json({ error: "customerId requerido" }, { status: 400 });
  }

  try {
    const photos = await prisma.clientPhoto.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: { storageKey: true, url: true, width: true, height: true, sizeBytes: true, createdAt: true },
    });
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("[GET /api/client-photos] Error:", error);
    return NextResponse.json({ error: "Error al consultar fotos" }, { status: 500 });
  }
}
