import { prisma } from "../config/db.js";

export const getCategories = () =>
  prisma.category.findMany({ orderBy: { name: "asc" } });

export const getCategoryById = (id) =>
  prisma.category.findUnique({ where: { category_id: Number(id) } });

export const createCategory = async (name) => {
  const trimmed_name = name?.trim();
  if (!trimmed_name) {
    const err = new Error("Category name is required");
    err.status = 400;
    throw err;
  }

  return prisma.category.create({
    data: { name: trimmed_name },
  });
};

export const updateCategory = async (id, name) => {
  const trimmed_name = name?.trim();
  if (!trimmed_name) {
    const err = new Error("Category name is required");
    err.status = 400;
    throw err;
  }

  return prisma.category.update({
    where: { category_id: Number(id) },
    data: { name: trimmed_name },
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
