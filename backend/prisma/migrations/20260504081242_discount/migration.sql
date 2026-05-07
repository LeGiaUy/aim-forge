-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- price trên ProductVariant đã được thêm ở migration
-- 20260504075121_product_variant_price (tránh duplicate khi replay shadow DB).

-- CreateTable
CREATE TABLE "Discount" (
    "discount_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("discount_id")
);

-- CreateTable
CREATE TABLE "DiscountProduct" (
    "discount_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("discount_id","product_id")
);

-- CreateTable
CREATE TABLE "DiscountVariant" (
    "discount_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,

    CONSTRAINT "DiscountVariant_pkey" PRIMARY KEY ("discount_id","variant_id")
);

-- CreateIndex
CREATE INDEX "Discount_start_at_idx" ON "Discount"("start_at");

-- CreateIndex
CREATE INDEX "Discount_end_at_idx" ON "Discount"("end_at");

-- CreateIndex
CREATE INDEX "DiscountProduct_product_id_idx" ON "DiscountProduct"("product_id");

-- CreateIndex
CREATE INDEX "DiscountVariant_variant_id_idx" ON "DiscountVariant"("variant_id");

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "Discount"("discount_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountVariant" ADD CONSTRAINT "DiscountVariant_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "Discount"("discount_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountVariant" ADD CONSTRAINT "DiscountVariant_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("variant_id") ON DELETE CASCADE ON UPDATE CASCADE;
