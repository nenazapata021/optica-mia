ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "transactionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "wompiStatus" TEXT;
CREATE UNIQUE INDEX "Order_transactionId_key" ON "Order"("transactionId");
