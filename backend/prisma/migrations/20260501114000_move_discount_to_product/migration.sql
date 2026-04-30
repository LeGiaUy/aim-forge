ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "discount_price" DECIMAL(65,30),
ADD COLUMN IF NOT EXISTS "discount_start" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "discount_end" TIMESTAMP(3);

ALTER TABLE "ProductVariant"
DROP COLUMN IF EXISTS "discount_price",
DROP COLUMN IF EXISTS "discount_start",
DROP COLUMN IF EXISTS "discount_end";
