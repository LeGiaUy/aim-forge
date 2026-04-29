ALTER TABLE "Product"
ADD COLUMN "price" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "Product" p
SET "price" = COALESCE(v.min_price, 0)
FROM (
  SELECT "product_id", MIN("price") AS min_price
  FROM "ProductVariant"
  GROUP BY "product_id"
) v
WHERE p."product_id" = v."product_id";

UPDATE "ProductVariant" pv
SET "price" = p."price"
FROM "Product" p
WHERE pv."product_id" = p."product_id";
