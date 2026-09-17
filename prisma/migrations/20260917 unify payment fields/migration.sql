-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('WOMPI', 'ADDI', 'SISTECREDITO');

-- AlterColumn - convertir paymentMethod existente a enum PaymentProvider
-- Como la columna ya existe de la migración 0002, la convertimos de TEXT a PaymentProvider
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentProvider" USING "paymentMethod"::text::"PaymentProvider";

-- AddColumn - externalId (nuevo campo, no existía antes)
ALTER TABLE "Order" ADD COLUMN "externalId" TEXT;

-- Comment: paymentMethod only applies when paymentProvider = WOMPI, values: CARD, NEQUI, PSE