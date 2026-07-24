import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const products = [
    { id: "foto1", name: "Montura Clásica", price: 120000, image: "/assets/foto1.jpg", categoria: "mujer", color: "Plata" },
    { id: "foto2", name: "Montura Moderna Slim", price: 120000, image: "/assets/foto2.jpg", categoria: "mujer", color: "Plata" },
    { id: "foto3", name: "Montura Aviador Rectangular", price: 120000, image: "/assets/foto3.jpg", categoria: "hombre", color: "Negro" },
    { id: "foto4", name: "Montura Retro", price: 135000, image: "/assets/foto4.jpg", categoria: "sol", color: "Negro" },
    { id: "foto5", name: "Montura Junior", price: 95000, image: "/assets/foto5.jpg", categoria: "niños", color: "Azul" },
    { id: "foto6", name: "Montura Cateye", price: 150000, image: "/assets/foto6.jpg", categoria: "mujer", color: "Carey" },
    { id: "gafas-de-sol1", name: "Gafas de Sol Aviador", price: 150000, image: "/assets/gafas de sol1.jpg", categoria: "sol", color: "Negro" },
    { id: "gafas-de-sol2", name: "Gafas de Sol Retro", price: 135000, image: "/assets/gafas de sol2.jpg", categoria: "sol", color: "Carey" },
    { id: "gafas-de-sol3", name: "Gafas de Sol Cateye Slim", price: 160000, image: "/assets/gafas de sol3.jpg", categoria: "sol", color: "Negro" },
    { id: "gafas-de-sol4", name: "Gafas de Sol Deportivas", price: 145000, image: "/assets/gafas de sol4.jpg", categoria: "sol", color: "Azul" },
    { id: "gafas-de-sol5", name: "Gafas de Sol Urbanas", price: 120000, image: "/assets/gafas de sol5.jpg", categoria: "sol", color: "Plata" },
    { id: "gafas-de-sol6", name: "Gafas de Sol Classic", price: 130000, image: "/assets/gafas de sol6.jpg", categoria: "sol", color: "Dorado" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log(`Seed completado: ${products.length} productos insertados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
