-- CreateTable
CREATE TABLE "Motor" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marca" TEXT,
    "forma" TEXT NOT NULL DEFAULT 'Redonda',
    "tags" TEXT[],
    "badge" TEXT,
    "imagenCatalogoUrl" TEXT NOT NULL,
    "imagenOverlayUrl" TEXT NOT NULL,
    "anchoRealMm" DOUBLE PRECISION NOT NULL,
    "anchoImagenPx" INTEGER NOT NULL,
    "offsetXPx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offsetYPx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anguloBaseGrados" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Motor_productId_key" ON "Motor"("productId");

-- AddForeignKey
ALTER TABLE "Motor" ADD CONSTRAINT "Motor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
