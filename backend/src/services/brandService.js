import { prisma } from "../config/db.js";

export const getBrands = () =>
  prisma.brand.findMany({ orderBy: { name: "asc" } });

export const getBrandById = (id) =>
  prisma.brand.findUnique({ where: { brand_id: Number(id) } });

export const createBrand = async ({ name, country }) => {
  const trimmed_name = name?.trim();
  if (!trimmed_name) {
    const err = new Error("Brand name is required");
    err.status = 400;
    throw err;
  }

  return prisma.brand.create({
    data: {
      name: trimmed_name,
      country: country?.trim() || null,
    },
  });
};

export const updateBrand = async (id, { name, country }) => {
  const trimmed_name = name?.trim();
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
