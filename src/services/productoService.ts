import { prisma } from "@/src/lib/prisma";

export async function getProductos() {
  return prisma.product.findMany({ orderBy: { name: "asc" } });
}

export async function getProductoPorId(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function getProductosPorCategoria(categoria: string) {
  return prisma.product.findMany({
    where: { categoria },
    orderBy: { name: "asc" },
  });
}

export type ProductoDTO = Awaited<ReturnType<typeof getProductos>>[number];
