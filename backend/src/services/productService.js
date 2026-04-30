import { z } from "zod";
import { prisma } from "../config/db.js";
import { getProductPricingPayload } from "./pricing.service.js";

const variantSchema = z.object({
  variant_id: z.number().int().optional(),
  color: z.string().min(1, "Color is required"),
  sku: z.string().optional(),
  stock: z.number().int(),
  images: z.array(z.string()).optional() // array of image urls
});

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  discount_price: z.number().nonnegative().optional().nullable(),
  discount_start: z.coerce.date().optional().nullable(),
  discount_end: z.coerce.date().optional().nullable(),
  category_id: z.number().int(),
  brand_id: z.number().int(),
  specs: z.array(z.object({
    attribute_id: z.number().int(),
    value: z.string()
  })).optional(),
  variants: z.array(variantSchema).min(1, "Product must have at least one variant")
});

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  discount_price: z.number().nonnegative().optional().nullable(),
  discount_start: z.coerce.date().optional().nullable(),
  discount_end: z.coerce.date().optional().nullable(),
  category_id: z.number().int().optional(),
  brand_id: z.number().int().optional(),
  specs: z.array(z.object({
    attribute_id: z.number().int(),
    value: z.string()
  })).optional(),
  variants: z.array(variantSchema).optional()
});

// ─── Shared variant include ─────────────────────────────────────────────────
const variantInclude = {
  images: {
    orderBy: { sort_order: "asc" },
  },
};

// Build where clause from query filters
const buildWhere = ({ category_id, brand_id, search }) => {
  const where = { is_active: true };

  if (category_id) where.category_id = Number(category_id);
  if (brand_id) where.brand_id = Number(brand_id);

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  return where;
};

// Format a product for list response (pricing from product)
const formatProductList = (product) => {
  const activeVariants = (product.variants || []).filter(v => v.is_active);

  const representative = activeVariants[0] || null;
  const total_stock = activeVariants.reduce((sum, v) => sum + v.stock, 0);

  const mainImage =
    representative?.images?.find((img) => img.is_main) ||
    representative?.images?.[0] ||
    null;

  const pricing = getProductPricingPayload({
    base_price: product.price,
    discount_price: product.discount_price,
    discount_start: product.discount_start,
    discount_end: product.discount_end
  });

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    brand: product.brand ? { brand_id: product.brand.brand_id, name: product.brand.name } : null,
    category: product.category
      ? { category_id: product.category.category_id, name: product.category.name }
      : null,
    price: pricing.price,
    final_price: pricing.final_price,
    discount_price: pricing.discount_price,
    discount_amount: pricing.discount_amount,
    discount_percent: pricing.discount_percent,
    total_stock,
    representative_variant: representative
      ? {
          variant_id: representative.variant_id,
          sku: representative.sku,
          stock: representative.stock,
          main_image: mainImage
            ? { image_url: mainImage.image_url, is_main: mainImage.is_main }
            : null,
          ...pricing,
        }
      : null,
  };
};

const buildArchivedSku = (sku, variant_id, archived_at) => {
  if (!sku) return null

  return `${sku}-del-${variant_id}-${archived_at}`
}

// Validation Helper
const validateProductAttributes = async (categoryId, specs) => {
  const categoryAttributes = await prisma.attribute.findMany({
    where: { category_id: categoryId },
    include: { values: true }
  });

  const validSpecAttrIds = categoryAttributes.map(a => a.attribute_id);
  // Validate specs
  if (specs) {
    for (const spec of specs) {
      if (!validSpecAttrIds.includes(spec.attribute_id)) {
        throw new Error(`Invalid SPEC attribute_id ${spec.attribute_id} for this category`);
      }
    }
  }

};

// ─── Service methods ─────────────────────────────────────────────────────────

export const getProducts = async (filters = {}) => {
  const { page = 1, limit = 10 } = filters;
  const where = buildWhere(filters);
  const skip = (Number(page) - 1) * Number(limit);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        brand: true,
        category: true,
        variants: {
          where: { is_active: true },
          include: {
            images: { orderBy: { sort_order: "asc" } },
          },
        },
      },
      orderBy: { product_id: "desc" },
    })
  ]);

  return {
    items: products.map(formatProductList),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    }
  };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { product_id: Number(id) },
    include: {
      brand: true,
      category: true,
      specs: {
        include: { attribute: true },
      },
      variants: {
        where: { is_active: true },
        include: variantInclude,
        orderBy: { variant_id: "asc" },
      },
    },
  });

  if (!product || !product.is_active) {
    const err = new Error("Product not found or inactive");
    err.status = 404;
    throw err;
  }

  const headlinePricing = getProductPricingPayload({
    base_price: product.price,
    discount_price: product.discount_price,
    discount_start: product.discount_start,
    discount_end: product.discount_end
  })

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    price: headlinePricing.price,
    final_price: headlinePricing.final_price,
    discount_price: headlinePricing.discount_price,
    discount_start: product.discount_start,
    discount_end: product.discount_end,
    discount_amount: headlinePricing.discount_amount,
    discount_percent: headlinePricing.discount_percent,
    category_id: product.category_id,
    brand_id: product.brand_id,
    brand: product.brand,
    category: product.category,
    specs: product.specs.map((s) => ({
      attribute_id: s.attribute_id,
      attribute: s.attribute.name,
      value: s.value,
    })),
    variants: product.variants.map((v) => {
      const vp = getProductPricingPayload({
        base_price: product.price,
        discount_price: product.discount_price,
        discount_start: product.discount_start,
        discount_end: product.discount_end
      });
      return {
        variant_id: v.variant_id,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        ...vp,
        images: v.images.map(img => img.image_url),
        attributes: v.color
          ? [{ attribute: "Color", value: v.color }]
          : [],
        // Detailed arrays for UI display
        images_detail: v.images,
        attributes_detail: v.color
          ? [{ attribute_id: null, value_id: null, attribute: "Color", value: v.color }]
          : [],
      };
    }),
  };
};

export const createProduct = async (body) => {
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const {
    name,
    description,
    price,
    discount_price,
    discount_start,
    discount_end,
    category_id,
    brand_id,
    specs,
    variants
  } = parsed.data;

  await validateProductAttributes(category_id, specs);

  // Nested write in one query is already atomic, avoid interactive tx timeout.
  return prisma.product.create({
    data: {
      name,
      description,
      price,
      discount_price: discount_price ?? null,
      discount_start: discount_start ?? null,
      discount_end: discount_end ?? null,
      category_id,
      brand_id,
      is_active: true,
      specs: specs?.length ? {
        createMany: {
          data: specs.map(s => ({
            attribute_id: s.attribute_id,
            value: s.value
          }))
        }
      } : undefined,
      variants: {
        create: variants.map(v => ({
            color: v.color,
          sku: v.sku,
          stock: v.stock,
          is_active: true,
          images: v.images?.length ? {
            createMany: {
              data: v.images.map((imgUrl, idx) => ({
                image_url: imgUrl,
                is_main: idx === 0,
                sort_order: idx + 1
              }))
            }
          } : undefined
        }))
      }
    },
    include: {
      specs: true,
      variants: { include: variantInclude }
    }
  });
};

export const updateProduct = async (id, body) => {
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const {
    name,
    description,
    price,
    discount_price,
    discount_start,
    discount_end,
    category_id,
    brand_id,
    specs,
    variants
  } = parsed.data;
  const product_id = Number(id)

  const existing = await prisma.product.findUnique({ where: { product_id } });
  if (!existing || !existing.is_active) {
    const err = new Error("Product not found or inactive");
    err.status = 404;
    throw err;
  }

  const catId = category_id || existing.category_id;
  await validateProductAttributes(catId, specs);

  return prisma.$transaction(async (tx) => {
    const archived_at = Date.now()

    // 1. Update basic product info
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = price;
    if (category_id !== undefined) dataToUpdate.category_id = category_id;
    if (discount_price !== undefined) dataToUpdate.discount_price = discount_price;
    if (discount_start !== undefined) dataToUpdate.discount_start = discount_start;
    if (discount_end !== undefined) dataToUpdate.discount_end = discount_end;
    if (brand_id !== undefined) dataToUpdate.brand_id = brand_id;

    if (Object.keys(dataToUpdate).length > 0) {
      await tx.product.update({
        where: { product_id },
        data: dataToUpdate
      });
    }

    // 2. If specs provided, delete old and recreate
    if (specs !== undefined) {
      await tx.productAttributeValue.deleteMany({ where: { product_id } });
      if (specs.length > 0) {
        await tx.productAttributeValue.createMany({
          data: specs.map(s => ({
            product_id,
            attribute_id: s.attribute_id,
            value: s.value
          }))
        });
      }
    }

    // 3. If variants provided, handle upsert and soft-delete
    if (variants !== undefined) {
      const existingVars = await tx.productVariant.findMany({
        where: { product_id, is_active: true }
      });
      const existingIds = existingVars.map(v => v.variant_id);

      if (variants.length === 0) {
        // Clear all active variants
        for (const v of existingVars) {
          await tx.productVariant.update({
            where: { variant_id: v.variant_id },
            data: {
              is_active: false,
              sku: buildArchivedSku(v.sku, v.variant_id, archived_at)
            }
          });
        }
      } else {
        const incomingIds = variants.map(v => v.variant_id).filter(Boolean);
        const toDeactivate = existingIds.filter(eid => !incomingIds.includes(eid));

        // Soft delete missing variants and free up SKU
        for (const varId of toDeactivate) {
          const ev = existingVars.find(e => e.variant_id === varId);
          await tx.productVariant.update({
            where: { variant_id: varId },
            data: {
              is_active: false,
              sku: buildArchivedSku(ev?.sku, varId, archived_at)
            }
          });
        }

        // Process incoming variants (Upsert)
        for (const v of variants) {
          if (v.variant_id && existingIds.includes(v.variant_id)) {
            // Update existing variant
            await tx.variantImage.deleteMany({ where: { variant_id: v.variant_id } });

            const variant_update_data = {
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              is_active: true,
            };

            await tx.productVariant.update({
              where: { variant_id: v.variant_id },
              data: {
                ...variant_update_data,
                images: v.images?.length ? {
                  createMany: {
                    data: v.images.map((imgUrl, idx) => ({
                      image_url: imgUrl,
                      is_main: idx === 0,
                      sort_order: idx + 1
                    }))
                  }
                } : undefined
              }
            });
          } else {
            const variant_create_data = {
              product_id,
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              is_active: true,
            };

            await tx.productVariant.create({
              data: {
                ...variant_create_data,
                images: v.images?.length ? {
                  createMany: {
                    data: v.images.map((imgUrl, idx) => ({
                      image_url: imgUrl,
                      is_main: idx === 0,
                      sort_order: idx + 1
                    }))
                  }
                } : undefined
              }
            });
          }
        }
      }
    }
  }, {
    timeout: 20000
  }).then(() => getProductById(id));
};

export const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({ where: { product_id: Number(id) } });
  if (!existing || !existing.is_active) {
    const err = new Error("Product not found or already deleted");
    err.status = 404;
    throw err;
  }
  
  return prisma.$transaction(async (tx) => {
    await tx.productVariant.updateMany({
      where: { product_id: Number(id) },
      data: { is_active: false }
    });
    
    await tx.product.update({
      where: { product_id: Number(id) },
      data: { is_active: false }
    });
  });
};
