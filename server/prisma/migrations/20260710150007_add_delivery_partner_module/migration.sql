-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'delivery_partner';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryAssignedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryPartnerId" TEXT;

-- CreateIndex
CREATE INDEX "Order_deliveryPartnerId_idx" ON "Order"("deliveryPartnerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
