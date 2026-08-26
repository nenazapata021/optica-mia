import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const { images } = data as { images?: Array<{ url: string; angle?: string; alt?: string; sortOrder?: number }> };
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "images debe ser un array no vacío." }, { status: 400 });
  }
  const ALLOWED = ["FRONTAL", "LATERAL_DERECHO", "LATERAL_IZQUIERDO", "TRES_CUARTOS", "DETALLE"];
  const rows = images.slice(0, 10).map((r, idx) => ({
    url: String(r.url).trim(),
    angle: ALLOWED.includes(String(r.angle ?? "FRONTAL").toUpperCase()) ? String(r.angle ?? "FRONTAL").toUpperCase() as never : "FRONTAL" as never,
    alt: String(r.alt ?? "").trim() || `Imagen ${idx + 1}`,
    sortOrder: Number(r.sortOrder ?? idx),
  })).filter((r) => r.url);

  // Reemplazo transaccional: borrar y recrear ordenado
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.product.update({ where: { id }, data: { image: rows[0]?.url ?? undefined } }),
  ]);
  await prisma.productImage.createMany({
    data: rows.map((r) => ({ productId: id, ...r })),
  });
  const product = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  return NextResponse.json({ ok: true, product });
}
