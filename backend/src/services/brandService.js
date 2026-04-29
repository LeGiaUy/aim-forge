import { prisma } from "../config/db.js";

export const getBrands = () =>
  prisma.brand.findMany({ orderBy: { name: "asc" } });

export const getBrandById = (id) =>
  prisma.brand.findUnique({ where: { brand_id: Number(id) } });

const normalizeImageUrl = payload_value => {
  const single_url = payload_value?.image_url?.trim()
  return single_url || null
}

export const createBrand = async ({ name, country, image_url }) => {
  const trimmed_name = name?.trim();
  const normalized_image_url = normalizeImageUrl({ image_url })
  if (!trimmed_name) {
    const err = new Error("Brand name is required");
    err.status = 400;
    throw err;
  }

  return prisma.brand.create({
    data: {
      name: trimmed_name,
      country: country?.trim() || null,
      image_url: normalized_image_url
    },
  });
};

export const updateBrand = async (id, { name, country, image_url }) => {
  const trimmed_name = name?.trim();
  const normalized_image_url = normalizeImageUrl({ image_url })
  if (!trimmed_name) {
    const err = new Error("Brand name is required");
    err.status = 400;
    throw err;
  }

  return prisma.brand.update({
    where: { brand_id: Number(id) },
    data: {
      name: trimmed_name,
      country: country?.trim() || null,
      image_url: normalized_image_url
    },
  });
};

export const deleteBrand = async (id) => {
  const brand_id = Number(id);
  const products_count = await prisma.product.count({
    where: { brand_id },
  });

  if (products_count > 0) {
    const err = new Error("Cannot delete brand that has products");
    err.status = 400;
    throw err;
  }

  await prisma.brand.delete({
    where: { brand_id },
  });
};
