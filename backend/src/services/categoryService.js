import { prisma } from "../config/db.js";

export const getCategories = () =>
  prisma.category.findMany({ orderBy: { name: "asc" } });

export const getCategoryById = (id) =>
  prisma.category.findUnique({ where: { category_id: Number(id) } });
