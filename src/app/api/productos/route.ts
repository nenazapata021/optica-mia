import { NextResponse } from "next/server";
import { getProductos } from "../../../services/productoService";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const productos = await getProductos();
  return NextResponse.json({ productos });
}

const ALLOWED_ANGLES = ["FRONTAL", "LATERAL_DERECHO", "LATERAL_IZQUIERDO", "TRES_CUARTOS", "DETALLE"] as const;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, price, image, images, categoria, descripcion, color, modelo } = data;

    if (!name || price == null || (!image && !images) || !categoria) {
      return NextResponse.json(
        { error: "Nombre, precio, imagen y categoría son obligatorios." },
        { status: 400 }
      );
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "El precio debe ser un número mayor a 0." }, { status: 400 });
    }

    // Normalizar imágenes: soporta legacy `image` string + nuevo `images: [{url, angle, alt}]`
    const legacyUrl = image ? String(image).trim() : null;
    let imageRows: Array<{ url: string; angle: (typeof ALLOWED_ANGLES)[number]; alt: string; sortOrder: number }> = [];
    if (Array.isArray(images) && images.length > 0) {
      imageRows = images.slice(0, 10).map((img: unknown, idx: number) => {
        const row = img as Record<string, unknown>;
        const url = String(row.url ?? "").trim();
        const angleRaw = String(row.angle ?? "FRONTAL").toUpperCase();
        const angle = (ALLOWED_ANGLES as readonly string[]).includes(angleRaw) ? angleRaw : "FRONTAL";
        return {
          url,
          angle: angle as (typeof ALLOWED_ANGLES)[number],
          alt: String(row.alt ?? `${String(name).trim()} - ${angle}`).trim(),
          sortOrder: Number(row.sortOrder ?? idx),
        };
      }).filter((r: { url: string }) => r.url.length > 0);
    }
    if (imageRows.length === 0 && legacyUrl) {
      imageRows = [{ url: legacyUrl, angle: "FRONTAL", alt: String(name).trim(), sortOrder: 0 }];
    }
    if (imageRows.length === 0) {
      return NextResponse.json({ error: "Debe proporcionar al menos una imagen." }, { status: 400 });
    }

    const mainImage = imageRows[0].url;

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        price: priceNum,
        image: mainImage,
        categoria: String(categoria).trim(),
        descripcion: descripcion ? String(descripcion).trim() : "",
        color: color ? String(color).trim() : null,
        modelo: modelo ? String(modelo).trim() : null,
        images: {
          create: imageRows.map((r) => ({
            url: r.url,
            angle: r.angle,
            alt: r.alt,
            sortOrder: r.sortOrder,
          })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/productos] Error:", error);
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
