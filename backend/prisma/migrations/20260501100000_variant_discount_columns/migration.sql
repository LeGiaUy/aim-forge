ALTER TABLE "ProductVariant"
ADD COLUMN "discount_price" DECIMAL(65,30),
ADD COLUMN "discount_start" TIMESTAMP(3),
ADD COLUMN "discount_end" TIMESTAMP(3);
