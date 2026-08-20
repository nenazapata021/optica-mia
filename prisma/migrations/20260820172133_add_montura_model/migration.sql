-- CreateEnum
CREATE TYPE "MonturaCategoria" AS ENUM ('FORMULA', 'SOL');

-- CreateTable
CREATE TABLE "Montura" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "marca" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" "MonturaCategoria" NOT NULL,
    "forma" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "imagenPrincipal" TEXT NOT NULL,
    "imagenes" TEXT[],
    "tags" TEXT[],
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Montura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Montura_referencia_key" ON "Montura"("referencia");
