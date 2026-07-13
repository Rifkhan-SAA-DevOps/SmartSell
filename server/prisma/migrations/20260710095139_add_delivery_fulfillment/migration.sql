-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'not_assigned',
ADD COLUMN     "estimatedDelivery" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;
