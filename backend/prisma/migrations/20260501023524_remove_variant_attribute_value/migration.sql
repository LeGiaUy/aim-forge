-- DropForeignKey
ALTER TABLE "VariantAttributeValue" DROP CONSTRAINT "VariantAttributeValue_value_id_fkey";

-- DropForeignKey
ALTER TABLE "VariantAttributeValue" DROP CONSTRAINT "VariantAttributeValue_variant_id_fkey";

-- DropTable
DROP TABLE "VariantAttributeValue";
