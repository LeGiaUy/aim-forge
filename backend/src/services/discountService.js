import { z } from 'zod'
import { prisma } from '../config/db.js'
import { calculateDiscountPercent } from './pricing.service.js'

const discount_schema = z.object({
  name: z.string().min(1),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.coerce.number().positive(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
  min_final_price: z.coerce.number().nonnegative().optional(),
  product_ids: z.array(z.coerce.number().int().positive()).optional(),
  variant_ids: z.array(z.coerce.number().int().positive()).optional()
})

const discount_patch_schema = discount_schema.partial()

const include_target = {
  products: {
    include: {
      product: {
        select: { product_id: true, name: true }
      }
    }
  },
  variants: {
    include: {
      variant: {
        select: {
          variant_id: true,
          sku: true,
          product: { select: { product_id: true, name: true } }
        }
      }
    }
  }
}

const LIST_DEFAULT_LIMIT = 10
const LIST_MAX_LIMIT = 100

const validate_time_range = (start_at, end_at) => {
  if (!end_at) return
  const start_time = new Date(start_at).getTime()
  const end_time = new Date(end_at).getTime()
  if (!Number.isFinite(start_time) || !Number.isFinite(end_time)) {
    const err = new Error('start_at hoặc end_at không hợp lệ')
    err.status = 400
    throw err
  }
  if (end_time <= start_time) {
    const err = new Error('end_at phải lớn hơn start_at')
    err.status = 400
    throw err
  }
}

const to_number = raw => {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

const dedupe_ids = list => [...new Set((list || []).map(Number).filter(Boolean))]

const parse_time = raw => {
  if (!raw) return null
  const d = new Date(raw)
  if (!Number.isFinite(d.getTime())) return null
  return d
}

const normalize_range = (start_at, end_at) => {
  const start_date = parse_time(start_at)
  const end_date = parse_time(end_at)
  if (!start_date) {
    const err = new Error('start_at không hợp lệ')
    err.status = 400
    throw err
  }
  validate_time_range(start_date.toISOString(), end_date?.toISOString() || null)
  return { start_date, end_date }
}

const build_overlap_time_where = (start_at, end_at) => ({
  ...(end_at ? { start_at: { lte: end_at } } : {}),
  OR: [{ end_at: null }, { end_at: { gte: start_at } }]
})

const get_scope_from_ids = (product_ids, variant_ids) => {
  if ((variant_ids || []).length) return 'VARIANT'
  if ((product_ids || []).length) return 'PRODUCT'
  return 'GLOBAL'
}

const parse_discounted_price = (base_price, type, value) => {
  const amount = to_number(value)
  if (type === 'PERCENT') {
    const discount_amount = Math.round(base_price * (amount / 100))
    return Math.max(0, base_price - discount_amount)
  }
  if (type === 'FIXED') {
    return Math.max(0, Math.round(base_price - amount))
  }
  return base_price
}

const ensure_business_safety = async ({
  type,
  value,
  product_ids,
  variant_ids,
  min_final_price
}) => {
  if (type === 'PERCENT' && to_number(value) > 90) {
    const err = new Error('Giảm phần trăm không được vượt quá 90%')
    err.status = 400
    throw err
  }

  const scoped_variant_ids = dedupe_ids(variant_ids)
  const scoped_product_ids = dedupe_ids(product_ids)
  const effective_min_price = Number.isFinite(Number(min_final_price))
    ? Number(min_final_price)
    : 1000

  if (!scoped_variant_ids.length && !scoped_product_ids.length) return

  const variants = await prisma.productVariant.findMany({
    where: {
      is_active: true,
      OR: [
        scoped_variant_ids.length
          ? { variant_id: { in: scoped_variant_ids } }
          : undefined,
        scoped_product_ids.length
          ? { product_id: { in: scoped_product_ids } }
          : undefined
      ].filter(Boolean)
    },
    select: {
      variant_id: true,
      sku: true,
      price: true,
      cost_price: true
    }
  })

  const invalid_low = []
  const invalid_cost = []
  for (const item of variants) {
    const base_price = to_number(item.price)
    const final_price = parse_discounted_price(base_price, type, value)
    if (final_price < effective_min_price) {
      invalid_low.push(item.sku || `#${item.variant_id}`)
    }
    if (
      item.cost_price != null &&
      final_price < to_number(item.cost_price)
    ) {
      invalid_cost.push(item.sku || `#${item.variant_id}`)
    }
  }

  if (invalid_low.length || invalid_cost.length) {
    const chunks = []
    if (invalid_low.length) {
      chunks.push(
        `Có ${invalid_low.length} SKU dưới ngưỡng giá tối thiểu ${effective_min_price}`
      )
    }
    if (invalid_cost.length) {
      chunks.push(`Có ${invalid_cost.length} SKU thấp hơn giá vốn`)
    }
    const err = new Error(chunks.join('. '))
    err.status = 400
    throw err
  }
}

const assert_no_scope_conflict = async ({
  start_at,
  end_at,
  product_ids,
  variant_ids,
  excluded_discount_id
}) => {
  const next_product_ids = dedupe_ids(product_ids)
  const next_variant_ids = dedupe_ids(variant_ids)
  const next_scope = get_scope_from_ids(next_product_ids, next_variant_ids)

  const variant_rows = next_variant_ids.length
    ? await prisma.productVariant.findMany({
        where: { variant_id: { in: next_variant_ids } },
        select: { product_id: true }
      })
    : []
  const variant_product_ids = dedupe_ids(variant_rows.map(item => item.product_id))
  const all_target_product_ids = dedupe_ids([
    ...next_product_ids,
    ...variant_product_ids
  ])

  const overlap_where = {
    ...(excluded_discount_id ? { discount_id: { not: excluded_discount_id } } : {}),
    ...build_overlap_time_where(start_at, end_at)
  }

  const global_conflict = await prisma.discount.findFirst({
    where: {
      ...overlap_where,
      products: { none: {} },
      variants: { none: {} }
    },
    select: { discount_id: true }
  })
  if (global_conflict) {
    const err = new Error(
      `Xung đột thời gian với chương trình #${global_conflict.discount_id} (scope GLOBAL)`
    )
    err.status = 409
    throw err
  }

  if (next_scope === 'GLOBAL') {
    const any_conflict = await prisma.discount.findFirst({
      where: overlap_where,
      select: { discount_id: true }
    })
    if (any_conflict) {
      const err = new Error(
        `Xung đột thời gian với chương trình #${any_conflict.discount_id}`
      )
      err.status = 409
      throw err
    }
    return
  }

  const targeted_conflict = await prisma.discount.findFirst({
    where: {
      AND: [
        overlap_where,
        {
          OR: [
            all_target_product_ids.length
              ? { products: { some: { product_id: { in: all_target_product_ids } } } }
              : undefined,
            next_variant_ids.length
              ? { variants: { some: { variant_id: { in: next_variant_ids } } } }
              : undefined,
            all_target_product_ids.length
              ? {
                  variants: {
                    some: {
                      variant: { product_id: { in: all_target_product_ids } }
                    }
                  }
                }
              : undefined
          ].filter(Boolean)
        }
      ]
    },
    select: { discount_id: true }
  })
  if (targeted_conflict) {
    const err = new Error(
      `Xung đột thời gian với chương trình #${targeted_conflict.discount_id} trên cùng phạm vi`
    )
    err.status = 409
    throw err
  }
}

const compute_status = row => {
  const now = Date.now()
  const start_ts = new Date(row.start_at).getTime()
  const end_ts = row.end_at ? new Date(row.end_at).getTime() : null
  if (!row.is_active) return 'inactive'
  if (now < start_ts) return 'upcoming'
  if (end_ts != null && now > end_ts) return 'expired'
  return 'active'
}

const map_discount = row => ({
  discount_id: row.discount_id,
  name: row.name,
  type: row.type,
  value: Number(row.value),
  start_at: row.start_at,
  end_at: row.end_at,
  is_active: row.is_active,
  created_at: row.created_at,
  products: (row.products || []).map(link => ({
    product_id: link.product.product_id,
    name: link.product.name
  })),
  variants: (row.variants || []).map(link => ({
    variant_id: link.variant.variant_id,
    sku: link.variant.sku,
    product_id: link.variant.product.product_id,
    product_name: link.variant.product.name
  })),
  scope: get_scope_from_ids(
    (row.products || []).map(link => link.product.product_id),
    (row.variants || []).map(link => link.variant.variant_id)
  ),
  status: compute_status(row)
})

export const getDiscounts = async (query = {}) => {
  const now = new Date()
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(
    LIST_MAX_LIMIT,
    Math.max(1, Number(query.limit || LIST_DEFAULT_LIMIT))
  )
  const search = String(query.search || '').trim().toLowerCase()
  const status = String(query.status || '').trim().toLowerCase()
  const sort = String(query.sort || 'newest').trim().toLowerCase()
  const product_id_filter = Number(query.product_id || 0)
  const brand_id_filter = Number(query.brand_id || 0)
  const category_id_filter = Number(query.category_id || 0)

  const where_and = []
  if (search) {
    where_and.push({ name: { contains: search, mode: 'insensitive' } })
  }
  if (status === 'inactive') {
    where_and.push({ is_active: false })
  } else if (status === 'upcoming') {
    where_and.push({ is_active: true, start_at: { gt: now } })
  } else if (status === 'active') {
    where_and.push({
      is_active: true,
      start_at: { lte: now },
      OR: [{ end_at: null }, { end_at: { gte: now } }]
    })
  } else if (status === 'expired') {
    where_and.push({
      is_active: true,
      end_at: { lt: now }
    })
  }
  if (product_id_filter > 0) {
    where_and.push({
      OR: [
        { products: { some: { product_id: product_id_filter } } },
        {
          variants: {
            some: { variant: { product_id: product_id_filter } }
          }
        }
      ]
    })
  }
  if (brand_id_filter > 0) {
    where_and.push({
      OR: [
        {
          products: {
            some: { product: { brand_id: brand_id_filter } }
          }
        },
        {
          variants: {
            some: { variant: { product: { brand_id: brand_id_filter } } }
          }
        }
      ]
    })
  }
  if (category_id_filter > 0) {
    where_and.push({
      OR: [
        {
          products: {
            some: { product: { category_id: category_id_filter } }
          }
        },
        {
          variants: {
            some: {
              variant: { product: { category_id: category_id_filter } }
            }
          }
        }
      ]
    })
  }

  const order_by_map = {
    newest: [{ created_at: 'desc' }],
    start_asc: [{ start_at: 'asc' }, { discount_id: 'desc' }],
    start_desc: [{ start_at: 'desc' }, { discount_id: 'desc' }],
    end_asc: [{ end_at: 'asc' }, { discount_id: 'desc' }],
    end_desc: [{ end_at: 'desc' }, { discount_id: 'desc' }]
  }

  const where = where_and.length ? { AND: where_and } : {}
  const [total, rows] = await Promise.all([
    prisma.discount.count({ where }),
    prisma.discount.findMany({
      where,
      include: include_target,
      orderBy: order_by_map[sort] || order_by_map.newest,
      skip: (page - 1) * limit,
      take: limit
    })
  ])

  return {
    items: rows.map(map_discount),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit))
    }
  }
}

export const createDiscount = async body => {
  const parsed = discount_schema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map(item => item.message).join(', '))
    err.status = 400
    throw err
  }
  const {
    name,
    type,
    value,
    start_at,
    end_at,
    is_active = true,
    product_ids = [],
    variant_ids = [],
    min_final_price
  } = parsed.data
  const product_ids_clean = dedupe_ids(product_ids)
  const variant_ids_clean = dedupe_ids(variant_ids)
  const { start_date, end_date } = normalize_range(start_at, end_at)
  await assert_no_scope_conflict({
    start_at: start_date,
    end_at: end_date,
    product_ids: product_ids_clean,
    variant_ids: variant_ids_clean
  })
  await ensure_business_safety({
    type,
    value,
    product_ids: product_ids_clean,
    variant_ids: variant_ids_clean,
    min_final_price
  })

  const created = await prisma.$transaction(async tx => {
    return tx.discount.create({
      data: {
        name: name.trim(),
        type,
        value,
        start_at: start_date,
        end_at: end_date,
        is_active,
        products: product_ids_clean.length
          ? {
              createMany: {
                data: product_ids_clean.map(product_id => ({
                  product_id
                }))
              }
            }
          : undefined,
        variants: variant_ids_clean.length
          ? {
              createMany: {
                data: variant_ids_clean.map(variant_id => ({
                  variant_id
                }))
              }
            }
          : undefined
      },
      include: include_target
    })
  })

  return map_discount(created)
}

export const updateDiscount = async (id, body) => {
  const discount_id = Number(id)
  const parsed = discount_patch_schema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map(item => item.message).join(', '))
    err.status = 400
    throw err
  }
  const patch_data = parsed.data
  if (!Object.keys(patch_data).length) {
    const err = new Error('Payload rỗng')
    err.status = 400
    throw err
  }

  const existing = await prisma.discount.findUnique({ where: { discount_id } })
  if (!existing) {
    const err = new Error('Discount không tồn tại')
    err.status = 404
    throw err
  }

  const next_start_at = patch_data.start_at ?? existing.start_at.toISOString()
  const next_end_at =
    patch_data.end_at !== undefined
      ? patch_data.end_at
      : existing.end_at
        ? existing.end_at.toISOString()
        : null
  const rows = await prisma.discount.findUnique({
    where: { discount_id },
    include: {
      products: { select: { product_id: true } },
      variants: { select: { variant_id: true } }
    }
  })
  const next_product_ids =
    patch_data.product_ids !== undefined
      ? dedupe_ids(patch_data.product_ids)
      : (rows.products || []).map(x => x.product_id)
  const next_variant_ids =
    patch_data.variant_ids !== undefined
      ? dedupe_ids(patch_data.variant_ids)
      : (rows.variants || []).map(x => x.variant_id)
  const { start_date, end_date } = normalize_range(next_start_at, next_end_at)
  await assert_no_scope_conflict({
    start_at: start_date,
    end_at: end_date,
    product_ids: next_product_ids,
    variant_ids: next_variant_ids,
    excluded_discount_id: discount_id
  })
  await ensure_business_safety({
    type: patch_data.type ?? existing.type,
    value: patch_data.value ?? Number(existing.value),
    product_ids: next_product_ids,
    variant_ids: next_variant_ids,
    min_final_price: patch_data.min_final_price
  })

  const updated = await prisma.$transaction(async tx => {
    const core_data = {}
    if (patch_data.name !== undefined) core_data.name = patch_data.name.trim()
    if (patch_data.type !== undefined) core_data.type = patch_data.type
    if (patch_data.value !== undefined) core_data.value = patch_data.value
    if (patch_data.start_at !== undefined) {
      core_data.start_at = start_date
    }
    if (patch_data.end_at !== undefined) {
      core_data.end_at = end_date
    }
    if (patch_data.is_active !== undefined) {
      core_data.is_active = patch_data.is_active
    }
    if (Object.keys(core_data).length) {
      await tx.discount.update({
        where: { discount_id },
        data: core_data
      })
    }

    if (patch_data.product_ids !== undefined) {
      await tx.discountProduct.deleteMany({ where: { discount_id } })
      if (patch_data.product_ids.length) {
        await tx.discountProduct.createMany({
          data: next_product_ids.map(product_id => ({
            discount_id,
            product_id
          }))
        })
      }
    }

    if (patch_data.variant_ids !== undefined) {
      await tx.discountVariant.deleteMany({ where: { discount_id } })
      if (patch_data.variant_ids.length) {
        await tx.discountVariant.createMany({
          data: next_variant_ids.map(variant_id => ({
            discount_id,
            variant_id
          }))
        })
      }
    }

    return tx.discount.findUnique({
      where: { discount_id },
      include: include_target
    })
  })

  return map_discount(updated)
}

export const previewDiscount = async body => {
  const parsed = discount_schema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map(item => item.message).join(', '))
    err.status = 400
    throw err
  }
  const {
    type,
    value,
    product_ids = [],
    variant_ids = [],
    min_final_price
  } = parsed.data
  await ensure_business_safety({
    type,
    value,
    product_ids,
    variant_ids,
    min_final_price
  })

  const product_ids_clean = dedupe_ids(product_ids)
  const variant_ids_clean = dedupe_ids(variant_ids)
  let variants = []
  if (!product_ids_clean.length && !variant_ids_clean.length) {
    variants = await prisma.productVariant.findMany({
      where: { is_active: true },
      take: 1000,
      include: {
        product: { select: { name: true } }
      }
    })
  } else {
    variants = await prisma.productVariant.findMany({
      where: {
        is_active: true,
        OR: [
          variant_ids_clean.length
            ? { variant_id: { in: variant_ids_clean } }
            : undefined,
          product_ids_clean.length
            ? { product_id: { in: product_ids_clean } }
            : undefined
        ].filter(Boolean)
      },
      include: {
        product: { select: { name: true } }
      }
    })
  }

  const configured_percent =
    type === 'PERCENT' ? to_number(value) : null

  const rows = variants.map(item => {
    const base_price = to_number(item.price)
    const final_price = parse_discounted_price(base_price, type, value)
    const effective_percent = calculateDiscountPercent(
      base_price,
      final_price
    )
    return {
      variant_id: item.variant_id,
      sku: item.sku,
      product_name: item.product?.name || '',
      base_price,
      final_price,
      discount_percent:
        configured_percent != null ?
          configured_percent
        : effective_percent,
      effective_discount_percent: effective_percent,
      below_zero: final_price <= 0,
      below_cost:
        item.cost_price != null && final_price < to_number(item.cost_price)
    }
  })

  const affected = rows.length
  const avg_discount_percent =
    configured_percent != null ?
      configured_percent
    : affected > 0 ?
      Math.round(
        (
          rows.reduce(
            (sum, row) => sum + row.effective_discount_percent,
            0
          ) / affected
        ) * 100
      ) / 100
    : 0

  return {
    affected_sku_count: affected,
    avg_discount_percent,
    invalid_zero_or_negative_count: rows.filter(row => row.below_zero).length,
    invalid_below_cost_count: rows.filter(row => row.below_cost).length,
    samples: rows.slice(0, 12)
  }
}

export const deleteDiscount = async id => {
  const discount_id = Number(id)
  const existing = await prisma.discount.findUnique({ where: { discount_id } })
  if (!existing) {
    const err = new Error('Discount không tồn tại')
    err.status = 404
    throw err
  }
  await prisma.discount.delete({ where: { discount_id } })
}
