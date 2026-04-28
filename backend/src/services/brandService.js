import { prisma } from "../config/db.js";

export const getBrands = () =>
  prisma.brand.findMany({ orderBy: { name: "asc" } });

export const getBrandById = (id) =>
  prisma.brand.findUnique({ where: { brand_id: Number(id) } });
