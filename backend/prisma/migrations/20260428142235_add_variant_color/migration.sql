-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "color" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Attribute" DROP COLUMN "type";

-- DropEnum
DROP TYPE "AttributeType";
