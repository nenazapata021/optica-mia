import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeImageBuffer } from "@/lib/normalizeImageServer";

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

    // Validar tipo de archivo
    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG o WEBP." },
        { status: 400 },
      );
    }

    // Validar customer existe
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer no encontrado. Verifica el email único." }, { status: 404 });
    }

    // Leer buffer del archivo
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Normalizar server-side con sharp: cover crop centrado + resize 1024×1024 PNG
    let normalized;
    try {
      normalized = await normalizeImageBuffer(inputBuffer, file.type);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al procesar la imagen.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Generar nombre único
    const storageKey = `${crypto.randomUUID()}-${Date.now()}.png`;
    const url = `/api/client-photos/${storageKey}`;

    // Guardar en PostgreSQL con dimensiones reales del procesamiento
    // Prisma Bytes requires Uint8Array<ArrayBuffer> — convert from sharp output
    const dataBuffer = Buffer.from(normalized.buffer);

    await prisma.clientPhoto.create({
      data: {
        storageKey,
        url,
        mimeType: normalized.mimeType,
        sizeBytes: normalized.sizeBytes,
        width: normalized.width,
        height: normalized.height,
        data: dataBuffer,
        customerId,
      },
    });

    return NextResponse.json({ url, storageKey, sizeBytes: normalized.sizeBytes }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/client-photos] Error:", error);
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
