/*
  Warnings:

  - You are about to drop the column `discount_end` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discount_price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discount_start` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "discount_end",
DROP COLUMN "discount_price",
DROP COLUMN "discount_start",
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "compare_price" DECIMAL(65,30),
ADD COLUMN     "cost_price" DECIMAL(65,30),
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL DEFAULT 0;
