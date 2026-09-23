import { prisma } from "../lib/prisma";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
} as const;

export async function getProductos() {
  return prisma.product.findMany({ include: productInclude, orderBy: { name: "asc" } });
}

export async function getProductoPorId(id: string) {
  return prisma.product.findUnique({ where: { id }, include: productInclude });
}

export async function getProductosPorCategoria(categoria: string) {
  return prisma.product.findMany({
    where: { categoria },
    include: productInclude,
    orderBy: { name: "asc" },
  });
}

export type ProductoDTO = Awaited<ReturnType<typeof getProductos>>[number];
export type ProductoWithImages = ProductoDTO;
