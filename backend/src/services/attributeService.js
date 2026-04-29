import { prisma } from "../config/db.js";

export const getAttributes = async (categoryId) => {
  const where = {};
  if (categoryId) {
    where.category_id = Number(categoryId);
  }

  const attributes = await prisma.attribute.findMany({
    where,
    include: {
      values: {
        orderBy: { value_id: "asc" },
      },
    },
    orderBy: { attribute_id: "asc" },
  });

  return attributes;
};

export const getAttributeById = async (id) =>
  prisma.attribute.findUnique({
    where: { attribute_id: Number(id) },
    include: { values: true },
  });

export const createAttribute = async ({ name, category_id }) => {
  const trimmed_name = name?.trim();
  if (!trimmed_name) {
    const err = new Error("Attribute name is required");
    err.status = 400;
    throw err;
  }

  if (!category_id) {
    const err = new Error("Category is required");
    err.status = 400;
    throw err;
  }

  return prisma.attribute.create({
    data: {
      name: trimmed_name,
      category_id: Number(category_id),
    },
    include: { values: true },
  });
};

export const createAttributesBatch = async ({ names, category_id }) => {
  if (!category_id) {
    const err = new Error("Category is required");
    err.status = 400;
    throw err;
  }

  const normalized_names = Array.isArray(names)
    ? names
        .map(name_value => String(name_value || "").trim())
        .filter(Boolean)
    : [];

  if (normalized_names.length === 0) {
    const err = new Error("At least one attribute name is required");
    err.status = 400;
    throw err;
  }

  const created_attributes = [];
  for (const attribute_name of normalized_names) {
    const created = await prisma.attribute.create({
      data: {
        name: attribute_name,
        category_id: Number(category_id),
      },
      include: { values: true },
    });
    created_attributes.push(created);
  }

  return created_attributes;
};

export const updateAttribute = async (id, { name }) => {
  const trimmed_name = name?.trim();
  if (!trimmed_name) {
    const err = new Error("Attribute name is required");
    err.status = 400;
    throw err;
  }

  return prisma.attribute.update({
    where: { attribute_id: Number(id) },
    data: {
      name: trimmed_name,
    },
    include: { values: true },
  });
};

export const deleteAttribute = async (id) => {
  const attribute_id = Number(id);
  const [spec_usages, values] = await Promise.all([
    prisma.productAttributeValue.count({ where: { attribute_id } }),
    prisma.attributeValue.findMany({
      where: { attribute_id },
      select: { value_id: true },
    }),
  ]);

  const value_ids = values.map((item) => item.value_id);
  const variant_usages =
    value_ids.length > 0
      ? await prisma.variantAttributeValue.count({
          where: { value_id: { in: value_ids } },
        })
      : 0;

  if (spec_usages > 0 || variant_usages > 0) {
    const err = new Error("Cannot delete attribute that is already used");
    err.status = 400;
    throw err;
  }

  await prisma.attribute.delete({
    where: { attribute_id },
  });
};
