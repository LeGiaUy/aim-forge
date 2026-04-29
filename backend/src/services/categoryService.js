import { prisma } from "../config/db.js";

export const getCategories = () =>
  prisma.category.findMany({ orderBy: { name: "asc" } });

export const getCategoryById = (id) =>
  prisma.category.findUnique({ where: { category_id: Number(id) } });

const normalizeImageUrl = payload_value => {
  const single_url = payload_value?.image_url?.trim()
  return single_url || null
}

export const createCategory = async payload_value => {
  const { name } = payload_value || {}
  const trimmed_name = name?.trim();
  const image_url = normalizeImageUrl(payload_value)
  if (!trimmed_name) {
    const err = new Error("Category name is required");
    err.status = 400;
    throw err;
  }

  return prisma.category.create({
    data: {
      name: trimmed_name,
      image_url
    },
  });
};

export const updateCategory = async (id, payload_value) => {
  const { name } = payload_value || {}
  const trimmed_name = name?.trim();
  const image_url = normalizeImageUrl(payload_value)
  if (!trimmed_name) {
    const err = new Error("Category name is required");
    err.status = 400;
    throw err;
  }

  return prisma.category.update({
    where: { category_id: Number(id) },
    data: {
      name: trimmed_name,
      image_url
    },
  });
};

export const deleteCategory = async (id) => {
  const category_id = Number(id);
  const products_count = await prisma.product.count({
    where: { category_id },
  });

  if (products_count > 0) {
    const err = new Error("Cannot delete category that has products");
    err.status = 400;
    throw err;
  }

  await prisma.category.delete({
    where: { category_id },
  });
};
