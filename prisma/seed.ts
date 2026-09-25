import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;
  
  const passwordHash = await hashPassword(adminPassword);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "admin", nombre: "Admin" },
    create: { email: adminEmail, nombre: "Admin", passwordHash, role: "admin" }
  });
}

async function main() {
  const products = [
    { id: "foto1", name: "Montura Clásica", price: 120000, image: "/assets/foto1.jpg", categoria: "mujer", color: "Plata" },
    { id: "foto2", name: "Montura Moderna Slim", price: 120000, image: "/assets/foto2.jpg", categoria: "mujer", color: "Plata" },
    { id: "foto3", name: "Montura Aviador Rectangular", price: 120000, image: "/assets/foto3.jpg", categoria: "hombre", color: "Negro" },
    { id: "foto4", name: "Montura Ejecutiva", price: 135000, image: "/assets/foto4.jpg", categoria: "hombre", color: "Negro" },
    { id: "foto5", name: "Montura Kids", price: 95000, image: "/assets/foto5.jpg", categoria: "niños", color: "Azul" },
    { id: "foto6", name: "Montura Cateye", price: 150000, image: "/assets/foto6.jpg", categoria: "mujer", color: "Carey" },
    { id: "foto7", name: "Montura Elegante", price: 140000, image: "/assets/foto7.jpg", categoria: "mujer", color: "Dorado" },
    { id: "foto8", name: "Montura Metálica", price: 140000, image: "/assets/foto8.jpg", categoria: "hombre", color: "Plateado" },
    { id: "foto9", name: "Montura Redonda", price: 130000, image: "/assets/foto9.jpg", categoria: "mujer", color: "Negro" },
    { id: "foto10", name: "Montura Infantil Azul", price: 85000, image: "/assets/foto10.jpg", categoria: "niños", color: "Azul" },
    { id: "foto11", name: "Montura Ovalada", price: 155000, image: "/assets/foto11.jpg", categoria: "mujer", color: "Negro" },
    { id: "foto12", name: "Montura Rectangular", price: 170000, image: "/assets/foto12.jpg", categoria: "hombre", color: "Grafito" },
    { id: "foto13", name: "Montura Geométrica", price: 160000, image: "/assets/foto13.jpg", categoria: "mujer", color: "Negro" },
    { id: "foto14", name: "Montura Acetato", price: 120000, image: "/assets/foto14.jpg", categoria: "mujer", color: "Carey" },
    { id: "foto15", name: "Montura Oversized", price: 180000, image: "/assets/foto15.jpg", categoria: "mujer", color: "Negro" },
    { id: "foto16", name: "Montura Deportiva", price: 145000, image: "/assets/foto16.jpg", categoria: "hombre", color: "Rojo" },
    { id: "foto17", name: "Montura Minimalista", price: 110000, image: "/assets/foto17.jpg", categoria: "mujer", color: "Blanco" },
    { id: "foto18", name: "Montura Vintage", price: 165000, image: "/assets/foto18.jpg", categoria: "sol", color: "Miel" },
    { id: "foto19", name: "Montura Wayfarer", price: 150000, image: "/assets/foto19.jpg", categoria: "hombre", color: "Negro" },
    { id: "foto20", name: "Montura Aviador Dorado", price: 175000, image: "/assets/foto20.jpg", categoria: "mujer", color: "Dorado" },
    { id: "foto21", name: "Montura Clubmaster", price: 135000, image: "/assets/foto21.jpg", categoria: "hombre", color: "Negro" },
    { id: "gafas-de-sol1", name: "Gafas de Sol Aviador", price: 210000, image: "/assets/gafas de sol1.jpg", categoria: "sol", color: "Negro" },
    { id: "gafas-de-sol2", name: "Gafas de Sol Retro", price: 135000, image: "/assets/gafas de sol2.jpg", categoria: "sol", color: "Carey" },
    { id: "gafas-de-sol3", name: "Gafas de Sol Cateye Slim", price: 160000, image: "/assets/gafas de sol3.jpg", categoria: "sol", color: "Negro" },
    { id: "gafas-de-sol4", name: "Gafas de Sol Deportivas", price: 145000, image: "/assets/gafas de sol4.jpg", categoria: "sol", color: "Azul" },
    { id: "gafas-de-sol5", name: "Gafas de Sol Urbanas", price: 120000, image: "/assets/gafas de sol5.jpg", categoria: "sol", color: "Plata" },
    { id: "gafas-de-sol6", name: "Gafas de Sol Classic", price: 130000, image: "/assets/gafas de sol6.jpg", categoria: "sol", color: "Dorado" },
    { id: "gafas-redondas-negras", name: "Gafas Redondas Negras", price: 155000, image: "/assets/Gafas Redondas Negras.jpg", categoria: "sol", color: "Negro" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        image: product.image,
        categoria: product.categoria,
        color: product.color,
      },
      create: product,
    });

    const baseName = product.image.replace(/\.(jpg|png|webp)$/i, "");
    const angles: Array<{ angle: "FRONTAL" | "LATERAL_DERECHO" | "LATERAL_IZQUIERDO" | "TRES_CUARTOS" | "DETALLE"; suffix: string; alt: string }> = [
      { angle: "FRONTAL", suffix: "", alt: `${product.name} - Vista frontal` },
      { angle: "LATERAL_DERECHO", suffix: "-lateral-der", alt: `${product.name} - Perfil derecho` },
      { angle: "LATERAL_IZQUIERDO", suffix: "-lateral-izq", alt: `${product.name} - Perfil izquierdo` },
      { angle: "TRES_CUARTOS", suffix: "-3cuartos", alt: `${product.name} - Vista 3/4` },
      { angle: "DETALLE", suffix: "-detalle", alt: `${product.name} - Detalle bisagra` },
    ];
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const url = i === 0 ? product.image : `${baseName}${a.suffix}.jpg`;
      await prisma.productImage.upsert({
        where: { productId_sortOrder: { productId: product.id, sortOrder: i } },
        update: { url, angle: a.angle, alt: a.alt },
        create: { productId: product.id, url, angle: a.angle, alt: a.alt, sortOrder: i },
      });
    }
  }

  console.log(`Seed completado: ${products.length} productos insertados (con 5 imágenes c/u)`);

  const motors = [
    {
      productId: "foto1",
      marca: "Optica Mia",
      forma: "Redonda",
      tags: ["clásica", "elegante", "mujer"],
      badge: "Más vendido",
      imagenCatalogoUrl: "/assets/foto1.jpg",
      imagenOverlayUrl: "/assets/foto1-sin-fondo.png",
      anchoRealMm: 138,
      anchoImagenPx: 800,
      offsetXPx: 0,
      offsetYPx: -5,
      anguloBaseGrados: 0,
    },
    {
      productId: "foto3",
      marca: "Optica Mia",
      forma: "Rectangular",
      tags: ["ejecutiva", "hombre", "moderna"],
      badge: "Nuevo",
      imagenCatalogoUrl: "/assets/foto3.jpg",
      imagenOverlayUrl: "/assets/foto3-sin-fondo.png",
      anchoRealMm: 142,
      anchoImagenPx: 850,
      offsetXPx: 2,
      offsetYPx: 0,
      anguloBaseGrados: 0,
    },
    {
      productId: "gafas-de-sol1",
      marca: "Optica Mia",
      forma: "Aviador",
      tags: ["sol", "aviador", "clásica"],
      badge: "Popular",
      imagenCatalogoUrl: "/assets/gafas de sol1.jpg",
      imagenOverlayUrl: "/assets/foto6-sin-fondo.png",
      anchoRealMm: 140,
      anchoImagenPx: 820,
      offsetXPx: 0,
      offsetYPx: -3,
      anguloBaseGrados: 0,
    },
  ];

  for (const motor of motors) {
    await prisma.motor.upsert({
      where: { productId: motor.productId },
      update: motor,
      create: motor,
    });
  }

  console.log(`Seed completado: ${motors.length} motores insertados`);

  await createAdminUser();
  console.log("Admin user creado/actualizado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });