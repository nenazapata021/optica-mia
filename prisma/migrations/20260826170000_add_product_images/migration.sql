-- CreateEnum
CREATE TYPE "ImageAngle" AS ENUM ('FRONTAL', 'LATERAL_DERECHO', 'LATERAL_IZQUIERDO', 'TRES_CUARTOS', 'DETALLE');

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "angle" "ImageAngle" NOT NULL DEFAULT 'FRONTAL',
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- Backfill legacy single image into new table (one row per product)
INSERT INTO "product_images" ("id", "productId", "url", "angle", "alt", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, "id", "image", 'FRONTAL'::"ImageAngle", "name", 0, NOW()
FROM "Product"
WHERE "image" IS NOT NULL
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE INDEX "product_images_productId_sortOrder_idx" ON "product_images"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_productId_sortOrder_key" ON "product_images"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
