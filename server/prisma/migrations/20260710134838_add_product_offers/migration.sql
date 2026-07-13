-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "offerNo" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "offeredAmount" DECIMAL(12,2) NOT NULL,
    "counterAmount" DECIMAL(12,2),
    "message" TEXT,
    "sellerNote" TEXT,
    "adminNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductOffer_offerNo_key" ON "ProductOffer"("offerNo");

-- CreateIndex
CREATE INDEX "ProductOffer_productId_idx" ON "ProductOffer"("productId");

-- CreateIndex
CREATE INDEX "ProductOffer_buyerId_idx" ON "ProductOffer"("buyerId");

-- CreateIndex
CREATE INDEX "ProductOffer_sellerId_idx" ON "ProductOffer"("sellerId");

-- CreateIndex
CREATE INDEX "ProductOffer_status_idx" ON "ProductOffer"("status");

-- CreateIndex
CREATE INDEX "ProductOffer_createdAt_idx" ON "ProductOffer"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
