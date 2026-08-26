import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!key) {
    return NextResponse.json({ error: "key requerido" }, { status: 400 });
  }

  try {
    const photo = await prisma.clientPhoto.findUnique({
      where: { storageKey: key },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    // Servir BYTEA como imagen PNG lista para MediaPipe
    return new NextResponse(new Uint8Array(photo.data), {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType, // image/png
        "Content-Length": String(photo.sizeBytes),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${photo.storageKey}"`,
      },
    });
  } catch (error) {
    console.error(`[GET /api/client-photos/${key}] Error:`, error);
    return NextResponse.json({ error: "Error al obtener foto" }, { status: 500 });
  }
}
