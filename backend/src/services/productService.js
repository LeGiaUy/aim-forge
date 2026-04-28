import { z } from "zod";
import { prisma } from "../config/db.js";

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category_id: z.number().int().optional(),
  brand_id: z.number().int().optional(),
});

// ─── Shared variant include ─────────────────────────────────────────────────
const variantInclude = {
  images: {
    orderBy: { sort_order: "asc" },
  },
  attributes: {
    include: {
      value: {
        include: { attribute: true },
      },
    },
  },
};

// Build where clause from query filters
const buildWhere = ({ category_id, brand_id, min_price, max_price }) => {
  const where = {};

  if (category_id) where.category_id = Number(category_id);
  if (brand_id) where.brand_id = Number(brand_id);

  if (min_price || max_price) {
    where.variants = {
      some: {
        price: {
          ...(min_price ? { gte: Number(min_price) } : {}),
          ...(max_price ? { lte: Number(max_price) } : {}),
        },
      },
    };
  }

  return where;
};

// Format a product for list response (only 1 representative variant)
const formatProductList = (product) => {
  const variants = product.variants || [];

  // Pick lowest-price variant as representative
  const sortedVariants = [...variants].sort(
    (a, b) => Number(a.price) - Number(b.price)
  );
  const representative = sortedVariants[0] || null;

  const mainImage =
    representative?.images?.find((img) => img.is_main) ||
    representative?.images?.[0] ||
    null;

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    brand: product.brand ? { brand_id: product.brand.brand_id, name: product.brand.name } : null,
    category: product.category
      ? { category_id: product.category.category_id, name: product.category.name }
      : null,
    lowest_price: representative ? Number(representative.price) : null,
    representative_variant: representative
      ? {
          variant_id: representative.variant_id,
          sku: representative.sku,
          price: Number(representative.price),
          stock: representative.stock,
          main_image: mainImage
            ? { image_url: mainImage.image_url, is_main: mainImage.is_main }
            : null,
        }
      : null,
  };
};

// ─── Service methods ─────────────────────────────────────────────────────────

export const getProducts = async (filters = {}) => {
  const where = buildWhere(filters);

  const products = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      variants: {
        include: {
          images: { orderBy: { sort_order: "asc" } },
        },
      },
    },
    orderBy: { product_id: "desc" },
  });

  return products.map(formatProductList);
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
        include: variantInclude,
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    category: product.category,
    specs: product.specs.map((s) => ({
      attribute: s.attribute.name,
      value: s.value,
    })),
    variants: product.variants.map((v) => ({
      variant_id: v.variant_id,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
      images: v.images,
      attributes: v.attributes.map((va) => ({
        attribute: va.value.attribute.name,
        value: va.value.value,
      })),
    })),
    lowest_price: product.variants.length > 0 ? Number(product.variants[0].price) : null,
  };
};

export const createProduct = async (body) => {
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }
  return prisma.product.create({ data: parsed.data });
};

export const updateProduct = async (id, body) => {
  const existing = await prisma.product.findUnique({ where: { product_id: Number(id) } });
  if (!existing) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return prisma.product.update({
    where: { product_id: Number(id) },
    data: body,
  });
};

export const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({ where: { product_id: Number(id) } });
  if (!existing) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  await prisma.product.delete({ where: { product_id: Number(id) } });
};
