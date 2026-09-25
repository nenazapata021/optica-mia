import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeImageBuffer } from "@/lib/normalizeImageServer";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 8MB)." }, { status: 400 });
    }

    // Validar magic bytes primeras muestras (no solo MIME)
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const header = inputBuffer.subarray(0, 8);
    const isJpeg = header[0] === 0xff && header[1] === 0xd8;
    const isPng = header[0] === 0x89 && header.toString("ascii", 1, 4) === "PNG";
    const isWebp = header.toString("ascii", 0, 4) === "RIFF";
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: "Archivo no es imagen válida." }, { status: 400 });
    }

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
        userId,
      },
    });

    return NextResponse.json({ url, storageKey, sizeBytes: normalized.sizeBytes }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/client-photos] Error:", error);
    return NextResponse.json({ error: "No se pudo guardar en PostgreSQL. Intenta de nuevo." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const photos = await prisma.clientPhoto.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { storageKey: true, url: true, width: true, height: true, sizeBytes: true, createdAt: true },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("[GET /api/client-photos] Error:", error);
    return NextResponse.json({ error: "Error al consultar fotos" }, { status: 500 });
  }
}