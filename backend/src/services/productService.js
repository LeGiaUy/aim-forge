import { z } from "zod";
import { prisma } from "../config/db.js";
import {
  getSimplePricingPayload,
  getVariantPricingPayload,
  normalizeVariantComparePrice,
} from "./pricing.service.js";
import { getGalleryImagesForVariant } from "./variantDisplay.service.js";

const productOptionValueSchema = z.object({
  value: z.string().min(1),
  sort_order: z.number().int().optional(),
  /** Nhiều URL cho một giá trị (vd. một màu) */
  images: z.array(z.string()).optional(),
});

const productOptionSchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().optional(),
  values: z.array(productOptionValueSchema).min(1),
});

const variantCreateSchema = z.object({
  variant_id: z.number().int().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int(),
  price: z.coerce.number().nonnegative(),
  compare_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  option_selections: z.array(z.coerce.number().int().nonnegative()),
});

const variantUpdateSchema = z.object({
  variant_id: z.number().int().optional(),
  sku: z.string().optional(),
  stock: z.number().int(),
  price: z.number().nonnegative().optional(),
  compare_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  /** Bắt buộc khi sản phẩm có ít nhất một ProductOption */
  option_value_ids: z.array(z.number().int().positive()).optional(),
});

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  /** Giá listing tùy chọn; không gửi = sync min(variant.price) sau khi tạo SKU */
  price: z.number().nonnegative().optional().nullable(),
  category_id: z.coerce.number().int(),
  brand_id: z.coerce.number().int(),
  specs: z
    .array(
      z.object({
        attribute_id: z.number().int(),
        value: z.string(),
      })
    )
    .optional(),
  product_options: z.array(productOptionSchema).min(1),
  variants: z.array(variantCreateSchema).min(1, "Product must have at least one variant"),
});

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional().nullable(),
  category_id: z.number().int().optional(),
  brand_id: z.number().int().optional(),
  specs: z
    .array(
      z.object({
        attribute_id: z.number().int(),
        value: z.string(),
      })
    )
    .optional(),
  variants: z.array(variantUpdateSchema).optional(),
  option_value_images: z
    .array(
      z.object({
        option_value_id: z.number().int().positive(),
        images: z.array(z.string()),
      })
    )
    .optional(),
});

const variantInclude = {
  variant_option_values: {
    include: {
      option_value: {
        include: {
          option: true,
          images: { orderBy: { sort_order: "asc" } },
        },
      },
    },
  },
};

const productOptionsInclude = {
  orderBy: { sort_order: "asc" },
  include: {
    option_values: {
      orderBy: { sort_order: "asc" },
      include: {
        images: { orderBy: { sort_order: "asc" } },
      },
    },
  },
};

/** Sắp xếp dòng option → value cho một variant (đã include quan hệ) */
const formatVariantOptionRows = (variant) => {
  return (variant.variant_option_values || [])
    .map((vov) => ({
      option_id: vov.option_value.option.option_id,
      option_name: vov.option_value.option.name,
      option_sort: vov.option_value.option.sort_order,
      option_value_id: vov.option_value.option_value_id,
      value: vov.option_value.value,
    }))
    .sort(
      (a, b) =>
        a.option_sort - b.option_sort ||
        a.option_id - b.option_id ||
        a.option_value_id - b.option_value_id
    );
};

/**
 * Lưới option_value_id theo thứ tự option: mỗi cột là danh sách id theo
 * sort_order giá trị.
 */
const buildValueGridFromProduct = (product) => {
  const opts = [...(product.product_options || [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.option_id - b.option_id
  );
  return opts.map((o) =>
    [...o.option_values].sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.option_value_id - b.option_value_id
    ).map((v) => v.option_value_id)
  );
};

const resolveOptionSelections = (selections, grid) => {
  if (selections.length !== grid.length) {
    const err = new Error("option_selections length must match product_options count");
    err.status = 400;
    throw err;
  }
  const ids = [];
  for (let i = 0; i < grid.length; i++) {
    const idx = selections[i];
    const col = grid[i];
    if (idx < 0 || idx >= col.length) {
      const err = new Error(`Invalid option_selections[${i}]`);
      err.status = 400;
      throw err;
    }
    ids.push(col[idx]);
  }
  return ids;
};

/**
 * Kiểm tra id thuộc product, mỗi option tối đa một value; trả signature + cache.
 */
const validateOptionValueIds = async (tx, product_id, option_value_ids) => {
  const uniq = [...new Set(option_value_ids)];
  const rows = await tx.productOptionValue.findMany({
    where: {
      option_value_id: { in: uniq },
      option: { product_id },
    },
    include: { option: true },
  });

  if (rows.length !== uniq.length) {
    const err = new Error("Invalid option_value_id for this product");
    err.status = 400;
    throw err;
  }

  const seen_option = new Set();
  for (const r of rows) {
    if (seen_option.has(r.option_id)) {
      const err = new Error("Variant must pick at most one value per option");
      err.status = 400;
      throw err;
    }
    seen_option.add(r.option_id);
  }

  const sorted = [...rows].sort(
    (a, b) =>
      a.option.sort_order - b.option.sort_order ||
      a.option.option_id - b.option.option_id ||
      a.sort_order - b.sort_order
  );

  const signature = [...sorted.map((r) => r.option_value_id)]
    .sort((a, b) => a - b)
    .join("|");
  const cache = Object.fromEntries(
    sorted.map((r) => [r.option.name, r.value])
  );
  return { signature, cache };
};

const syncVariantOptionLinks = async (tx, variant_id, product_id, ids) => {
  const { signature, cache } = await validateOptionValueIds(tx, product_id, ids);
  await tx.variantOptionValue.deleteMany({ where: { variant_id } });
  await tx.variantOptionValue.createMany({
    data: ids.map((option_value_id) => ({ variant_id, option_value_id })),
  });
  await tx.productVariant.update({
    where: { variant_id },
    data: {
      option_value_signature: signature,
      options_cache: cache,
    },
  });
};

/**
 * Product.price dùng sort/filter listing: giá gửi lên hoặc min(variant.price).
 */
const syncProductListingPrice = async (tx, product_id, explicit_listing_price) => {
  let next;
  if (explicit_listing_price !== undefined) {
    next = explicit_listing_price;
  } else {
    const agg = await tx.productVariant.aggregate({
      where: { product_id, is_active: true },
      _min: { price: true },
    });
    next = agg._min.price ?? null;
  }
  await tx.product.update({
    where: { product_id },
    data: { price: next },
  });
};

/** Parse số không âm từ query; null nếu không hợp lệ */
const parse_non_negative = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** sort: newest | price_asc | price_desc (theo Product.price = min SKU / listing) */
const build_order_by = (sort) => {
  const s = String(sort || "").toLowerCase();
  if (s === "price_asc") return { price: "asc" };
  if (s === "price_desc") return { price: "desc" };
  return { product_id: "desc" };
};

const build_where = (filters = {}) => {
  const { category_id, brand_id, search, min_price, max_price, in_stock } =
    filters;

  const where = { is_active: true };

  if (category_id) where.category_id = Number(category_id);
  if (brand_id) where.brand_id = Number(brand_id);

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const min_p = parse_non_negative(min_price);
  const max_p = parse_non_negative(max_price);
  const stock_only =
    in_stock === true ||
    in_stock === "true" ||
    in_stock === "1" ||
    in_stock === 1;

  const needs_variant_scope =
    stock_only || min_p !== null || max_p !== null;

  if (needs_variant_scope) {
    const variant_and = [{ is_active: true }];
    if (stock_only) variant_and.push({ stock: { gt: 0 } });
    const price_clause = {};
    if (min_p !== null || max_p !== null) {
      if (min_p !== null) price_clause.gte = min_p;
      if (max_p !== null) price_clause.lte = max_p;
      variant_and.push({ price: price_clause });
    }
    where.variants =
      variant_and.length > 1
        ? {
            some: { AND: variant_and },
          }
        : { some: variant_and[0] };
  }

  return where;
};

const formatProductOptionsResponse = (product) => {
  const opts = [...(product.product_options || [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.option_id - b.option_id
  );
  return opts.map((o) => ({
    option_id: o.option_id,
    name: o.name,
    sort_order: o.sort_order,
    values: o.option_values.map((v) => {
      const imgs_sorted = [...(v.images || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      return {
        option_value_id: v.option_value_id,
        value: v.value,
        sort_order: v.sort_order,
        images: imgs_sorted.map((img) => img.image_url),
        images_detail: imgs_sorted,
      };
    }),
  }));
};

const mapVariantToClient = (v, product, vp) => {
  const rows = formatVariantOptionRows(v);
  const attributes = rows.map((r) => ({
    attribute: r.option_name,
    value: r.value,
    value_id: r.option_value_id,
    option_id: r.option_id,
  }));
  const option_value_ids = rows.map((r) => r.option_value_id);

  const gallery = getGalleryImagesForVariant(v);
  return {
    variant_id: v.variant_id,
    sku: v.sku,
    stock: v.stock,
    sell_price: Number(v.price),
    compare_at_price:
      v.compare_price != null ? Number(v.compare_price) : null,
    cost_price: v.cost_price != null ? Number(v.cost_price) : null,
    option_value_ids,
    options_cache: v.options_cache,
    ...vp,
    images: gallery.map((img) => img.image_url),
    attributes,
    images_detail: gallery,
    attributes_detail: attributes,
  };
};

const formatProductList = (product) => {
  const activeVariants = (product.variants || []).filter((v) => v.is_active);

  const representative =
    [...activeVariants].sort(
      (a, b) =>
        Number(a.price) - Number(b.price) || a.variant_id - b.variant_id
    )[0] || null;
  const total_stock = activeVariants.reduce((sum, v) => sum + v.stock, 0);

  const gallery_list =
    representative ? getGalleryImagesForVariant(representative) : [];
  const mainImage =
    gallery_list.find((img) => img.is_main) || gallery_list[0] || null;

  const pricing = representative
    ? getVariantPricingPayload(representative)
    : getSimplePricingPayload(product.price ?? 0);

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    brand: product.brand
      ? {
          brand_id: product.brand.brand_id,
          name: product.brand.name,
          image_url: product.brand.image_url ?? null,
        }
      : null,
    category: product.category
      ? {
          category_id: product.category.category_id,
          name: product.category.name,
          image_url: product.category.image_url ?? null,
        }
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
  if (!sku) return null;
  return `${sku}-del-${variant_id}-${archived_at}`;
};

const validateProductAttributes = async (categoryId, specs) => {
  const categoryAttributes = await prisma.attribute.findMany({
    where: { category_id: categoryId },
    include: { values: true },
  });

  const validSpecAttrIds = categoryAttributes.map((a) => a.attribute_id);
  if (specs) {
    for (const spec of specs) {
      if (!validSpecAttrIds.includes(spec.attribute_id)) {
        throw new Error(
          `Invalid SPEC attribute_id ${spec.attribute_id} for this category`
        );
      }
    }
  }
};

export const getProducts = async (filters = {}) => {
  const { page = 1, limit = 10, sort } = filters;
  const where = build_where(filters);
  const order_by = build_order_by(sort);
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
          include: variantInclude,
          orderBy: { variant_id: "asc" },
        },
      },
      orderBy: order_by,
    }),
  ]);

  return {
    items: products.map(formatProductList),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { product_id: Number(id) },
    include: {
      brand: true,
      category: true,
      product_options: productOptionsInclude,
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

  const headline_variant =
    [...product.variants].sort(
      (a, b) =>
        Number(a.price) - Number(b.price) || a.variant_id - b.variant_id
    )[0] || null;
  const headlinePricing = headline_variant
    ? getVariantPricingPayload(headline_variant)
    : getSimplePricingPayload(product.price ?? 0);

  return {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    price: headlinePricing.price,
    final_price: headlinePricing.final_price,
    discount_price: headlinePricing.discount_price,
    discount_amount: headlinePricing.discount_amount,
    discount_percent: headlinePricing.discount_percent,
    /** Giá listing tham chiếu (sync từ admin / min SKU) */
    listing_price: product.price != null ? Number(product.price) : null,
    category_id: product.category_id,
    brand_id: product.brand_id,
    brand: product.brand,
    category: product.category,
    product_options: formatProductOptionsResponse(product),
    specs: product.specs.map((s) => ({
      attribute_id: s.attribute_id,
      attribute: s.attribute.name,
      value: s.value,
    })),
    variants: product.variants.map((v) => {
      const vp = getVariantPricingPayload(v);
      return mapVariantToClient(v, product, vp);
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
    price: listing_price_arg,
    category_id,
    brand_id,
    specs,
    product_options,
    variants,
  } = parsed.data;

  await validateProductAttributes(category_id, specs);

  const option_count = product_options.length;

  let new_product_id;

  await prisma.$transaction(
    async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          category_id,
          brand_id,
          is_active: true,
          specs: specs?.length
            ? {
                createMany: {
                  data: specs.map((s) => ({
                    attribute_id: s.attribute_id,
                    value: s.value,
                  })),
                },
              }
            : undefined,
          product_options: {
            create: product_options.map((opt, oi) => ({
              name: opt.name,
              sort_order: opt.sort_order ?? oi,
              option_values: {
                create: opt.values.map((val, vi) => {
                  const urls = (val.images || [])
                    .map((raw) => String(raw ?? "").trim())
                    .filter(Boolean);
                  return {
                    value: val.value,
                    sort_order: val.sort_order ?? vi,
                    images:
                      urls.length > 0
                        ? {
                            create: urls.map((image_url, idx) => ({
                              image_url,
                              is_main: idx === 0,
                              sort_order: idx + 1,
                            })),
                          }
                        : undefined,
                  };
                }),
              },
            })),
          },
        },
        include: {
          product_options: {
            include: { option_values: true },
            orderBy: { sort_order: "asc" },
          },
        },
      });

      new_product_id = product.product_id;
      const grid = buildValueGridFromProduct(product);

      if (grid.length !== option_count) {
        const err = new Error("product_options out of sync");
        err.status = 500;
        throw err;
      }

      for (const v of variants) {
        if (v.option_selections.length !== option_count) {
          const err = new Error("option_selections length must match product_options");
          err.status = 400;
          throw err;
        }
        const ids = resolveOptionSelections(v.option_selections, grid);
        const { signature, cache } = await validateOptionValueIds(
          tx,
          product.product_id,
          ids
        );

        const sku_trimmed =
          v.sku != null && String(v.sku).trim() ?
            String(v.sku).trim()
          : null;

        await tx.productVariant.create({
          data: {
            product_id: product.product_id,
            sku: sku_trimmed,
            stock: v.stock,
            price: v.price,
            compare_price: normalizeVariantComparePrice(v.price, v.compare_price),
            cost_price: v.cost_price ?? null,
            is_active: true,
            option_value_signature: signature,
            options_cache: cache,
            variant_option_values: {
              create: ids.map((option_value_id) => ({ option_value_id })),
            },
          },
        });
      }

      await syncProductListingPrice(
        tx,
        product.product_id,
        listing_price_arg !== undefined ? listing_price_arg : undefined
      );
    },
    { timeout: 30000 }
  );

  return getProductById(new_product_id);
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
    category_id,
    brand_id,
    specs,
    variants,
    option_value_images,
  } = parsed.data;
  const product_id = Number(id);

  const existing = await prisma.product.findUnique({ where: { product_id } });
  if (!existing || !existing.is_active) {
    const err = new Error("Product not found or inactive");
    err.status = 404;
    throw err;
  }

  const catId = category_id || existing.category_id;
  await validateProductAttributes(catId, specs);

  await prisma
    .$transaction(
      async (tx) => {
        const archived_at = Date.now();
        const option_count = await tx.productOption.count({
          where: { product_id },
        });

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (price !== undefined) dataToUpdate.price = price;
        if (category_id !== undefined) dataToUpdate.category_id = category_id;
        if (brand_id !== undefined) dataToUpdate.brand_id = brand_id;

        if (Object.keys(dataToUpdate).length > 0) {
          await tx.product.update({
            where: { product_id },
            data: dataToUpdate,
          });
        }

        if (specs !== undefined) {
          await tx.productAttributeValue.deleteMany({
            where: { product_id },
          });
          if (specs.length > 0) {
            await tx.productAttributeValue.createMany({
              data: specs.map((s) => ({
                product_id,
                attribute_id: s.attribute_id,
                value: s.value,
              })),
            });
          }
        }

        if (option_value_images !== undefined) {
          const allowed_rows = await tx.productOptionValue.findMany({
            where: { option: { product_id } },
            select: { option_value_id: true },
          });
          const allowed_ids = new Set(
            allowed_rows.map((r) => r.option_value_id)
          );

          for (const block of option_value_images) {
            if (!allowed_ids.has(block.option_value_id)) {
              const err = new Error(
                "Invalid option_value_id for this product"
              );
              err.status = 400;
              throw err;
            }
            await tx.optionValueImage.deleteMany({
              where: { option_value_id: block.option_value_id },
            });
            const urls = (block.images || [])
              .map((u) => String(u ?? "").trim())
              .filter(Boolean);
            if (urls.length > 0) {
              await tx.optionValueImage.createMany({
                data: urls.map((image_url, idx) => ({
                  option_value_id: block.option_value_id,
                  image_url,
                  is_main: idx === 0,
                  sort_order: idx + 1,
                })),
              });
            }
          }
        }

        if (variants === undefined) return;

        const existingVars = await tx.productVariant.findMany({
          where: { product_id, is_active: true },
        });
        const existingIds = existingVars.map((v) => v.variant_id);

        if (variants.length === 0) {
          for (const v of existingVars) {
            await tx.productVariant.update({
              where: { variant_id: v.variant_id },
              data: {
                is_active: false,
                sku: buildArchivedSku(v.sku, v.variant_id, archived_at),
              },
            });
          }
          await syncProductListingPrice(
            tx,
            product_id,
            price !== undefined ? price : undefined
          );
          return;
        }

        const incomingIds = variants.map((v) => v.variant_id).filter(Boolean);
        const toDeactivate = existingIds.filter(
          (eid) => !incomingIds.includes(eid)
        );

        for (const varId of toDeactivate) {
          const ev = existingVars.find((e) => e.variant_id === varId);
          await tx.productVariant.update({
            where: { variant_id: varId },
            data: {
              is_active: false,
              sku: buildArchivedSku(ev?.sku, varId, archived_at),
            },
          });
        }

        for (const v of variants) {
          if (
            option_count > 0 &&
            (!v.option_value_ids || v.option_value_ids.length === 0)
          ) {
            const err = new Error(
              "option_value_ids required for each variant when product has options"
            );
            err.status = 400;
            throw err;
          }

          if (v.variant_id && existingIds.includes(v.variant_id)) {
            const cur = existingVars.find(
              (ev) => ev.variant_id === v.variant_id
            );
            const variant_patch = {
              sku: v.sku,
              stock: v.stock,
              is_active: true,
            };
            if (v.cost_price !== undefined) {
              variant_patch.cost_price = v.cost_price;
            }
            if (v.price !== undefined) {
              variant_patch.price = v.price;
            }
            if (v.price !== undefined || v.compare_price !== undefined) {
              const sell =
                v.price !== undefined ? v.price : Number(cur.price);
              const cmp_src =
                v.compare_price !== undefined
                  ? v.compare_price
                  : cur.compare_price;
              variant_patch.compare_price = normalizeVariantComparePrice(
                sell,
                cmp_src
              );
            }

            await tx.productVariant.update({
              where: { variant_id: v.variant_id },
              data: {
                ...variant_patch,
              },
            });

            if (option_count > 0) {
              if (v.option_value_ids.length !== option_count) {
                const err = new Error(
                  "option_value_ids count must match product options count"
                );
                err.status = 400;
                throw err;
              }
              await syncVariantOptionLinks(
                tx,
                v.variant_id,
                product_id,
                v.option_value_ids
              );
            }
          } else {
            if (v.price === undefined) {
              const err = new Error("price required for new variant");
              err.status = 400;
              throw err;
            }

            const created = await tx.productVariant.create({
              data: {
                product_id,
                sku: v.sku ?? null,
                stock: v.stock,
                price: v.price,
                compare_price: normalizeVariantComparePrice(
                  v.price,
                  v.compare_price
                ),
                cost_price: v.cost_price ?? null,
                is_active: true,
              },
            });

            if (option_count > 0) {
              if (v.option_value_ids.length !== option_count) {
                const err = new Error(
                  "option_value_ids count must match product options count"
                );
                err.status = 400;
                throw err;
              }
              await syncVariantOptionLinks(
                tx,
                created.variant_id,
                product_id,
                v.option_value_ids
              );
            }
          }
        }

        await syncProductListingPrice(
          tx,
          product_id,
          price !== undefined ? price : undefined
        );
      },
      { timeout: 20000 }
    );

  return getProductById(id);
};

export const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({
    where: { product_id: Number(id) },
  });
  if (!existing || !existing.is_active) {
    const err = new Error("Product not found or already deleted");
    err.status = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    await tx.productVariant.updateMany({
      where: { product_id: Number(id) },
      data: { is_active: false },
    });

    await tx.product.update({
      where: { product_id: Number(id) },
      data: { is_active: false },
    });
  });
};
