-- Ảnh gắn theo ProductOptionValue (vd. một màu — nhiều ảnh), không còn theo SKU.

CREATE TABLE "OptionValueImage" (
    "image_id" SERIAL NOT NULL,
    "option_value_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionValueImage_pkey" PRIMARY KEY ("image_id")
);

CREATE INDEX "OptionValueImage_option_value_id_idx" ON "OptionValueImage"(
    "option_value_id"
);

ALTER TABLE "OptionValueImage" ADD CONSTRAINT
"OptionValueImage_option_value_id_fkey" FOREIGN KEY (
    "option_value_id"
) REFERENCES "ProductOptionValue" ("option_value_id") ON DELETE CASCADE ON
UPDATE CASCADE;

INSERT INTO "OptionValueImage" (
    "option_value_id",
    "image_url",
    "is_main",
    "sort_order"
)
SELECT DISTINCT ON (sel."option_value_id", vi."image_url")
    sel."option_value_id",
    vi."image_url",
    vi."is_main",
    vi."sort_order"
FROM "VariantImage" vi
INNER JOIN (
    SELECT DISTINCT ON (vov."variant_id")
        vov."variant_id",
        vov."option_value_id"
    FROM "VariantOptionValue" vov
    INNER JOIN "ProductOptionValue" pov ON pov."option_value_id" = vov."option_value_id"
    INNER JOIN "ProductOption" po ON po."option_id" = pov."option_id"
    ORDER BY vov."variant_id", po."sort_order" ASC, po."option_id" ASC
) sel ON sel."variant_id" = vi."variant_id"
ORDER BY sel."option_value_id", vi."image_url", vi."sort_order" ASC;

DROP TABLE "VariantImage";
