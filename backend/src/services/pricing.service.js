/**
 * Giá bán theo SKU: price = giá thực thu, compare_price = giá niêm (gạch ngang).
 */

const toNumber = value => {
  if (value === null || value === undefined) return 0
  return Number(value)
}

const parse_discounted_price = (sell, discount_row) => {
  if (!discount_row) return null
  const discount_value = toNumber(discount_row.value)
  if (discount_row.type === 'PERCENT') {
    const final = sell * (1 - discount_value / 100)
    return Math.max(0, Math.round(final))
  }
  if (discount_row.type === 'FIXED') {
    return Math.max(0, Math.round(sell - discount_value))
  }
  return null
}

export const pickBestActiveDiscount = variant => {
  const by_variant = (variant?.discount_variants || [])
    .map(row => ({ ...row.discount, __scope: 'VARIANT' }))
    .filter(Boolean)
  const by_product = (variant?.product?.discount_products || [])
    .map(row => ({ ...row.discount, __scope: 'PRODUCT' }))
    .filter(Boolean)
  const by_global = (variant?.global_discounts || [])
    .map(row => ({ ...row, __scope: 'GLOBAL' }))
    .filter(Boolean)
  const all_discounts = [...by_variant, ...by_product, ...by_global]
  if (!all_discounts.length) return null

  const sell = toNumber(variant?.price)
  const priority_score = {
    VARIANT: 3,
    PRODUCT: 2,
    GLOBAL: 1
  }
  let best = null
  for (const discount_row of all_discounts) {
    const discounted = parse_discounted_price(sell, discount_row)
    if (discounted === null) continue
    const next_priority = priority_score[discount_row.__scope] || 0
    const should_take =
      best === null ||
      next_priority > (best.priority || 0) ||
      (next_priority === (best.priority || 0) &&
        (discounted < best.final_price ||
          (discounted === best.final_price &&
            new Date(discount_row.created_at || 0).getTime() >
              new Date(best.created_at || 0).getTime())))

    if (should_take) {
      best = {
        discount_id: discount_row.discount_id,
        name: discount_row.name,
        type: discount_row.type,
        value: toNumber(discount_row.value),
        final_price: discounted,
        scope: discount_row.__scope,
        priority: next_priority,
        created_at: discount_row.created_at
      }
    }
  }
  return best
}

export const calculateSaving = (price, discountPrice) => {
  return Math.max(0, Math.round(toNumber(price) - toNumber(discountPrice)))
}

export const calculateDiscountPercent = (price, discountPrice) => {
  const p = toNumber(price)
  if (p <= 0) return 0
  const d = toNumber(discountPrice)
  return Math.round(((p - d) / p) * 10000) / 100
}

/**
 * Chuẩn hoá compare_price: chỉ giữ khi > giá bán.
 */
export const normalizeVariantComparePrice = (sell_raw, compare_raw) => {
  const sell = toNumber(sell_raw)
  if (compare_raw === null || compare_raw === undefined) return null
  const c = toNumber(compare_raw)
  if (!Number.isFinite(c) || c <= sell) return null
  return c
}

/**
 * Payload hiển thị / API thống nhất (tương thích field cũ discount_*).
 */
export const getVariantPricingPayload = variant => {
  const sell = toNumber(variant?.price)
  const active_discount = pickBestActiveDiscount(variant)
  const discounted_sell =
    active_discount?.final_price != null ? active_discount.final_price : sell

  const compare = normalizeVariantComparePrice(sell, variant?.compare_price)
  const strike = compare != null ? compare : sell
  const on_sale = discounted_sell < strike

  return {
    price: on_sale ? strike : sell,
    final_price: discounted_sell,
    discount_price: on_sale ? discounted_sell : null,
    discount_amount: on_sale ? calculateSaving(strike, discounted_sell) : null,
    discount_percent: on_sale
      ? calculateDiscountPercent(strike, discounted_sell)
      : null,
    discount_meta: active_discount
      ? {
          discount_id: active_discount.discount_id,
          name: active_discount.name,
          type: active_discount.type,
          value: active_discount.value,
          scope: active_discount.scope
        }
      : null
  }
}

/**
 * Fallback khi chỉ có Product.price (listing), không có variant.
 */
export const getSimplePricingPayload = amount => {
  const p = toNumber(amount)
  return {
    price: p,
    final_price: p,
    discount_price: null,
    discount_amount: null,
    discount_percent: null,
  }
}

/** Đơn giá bán snapshot (cart / order). */
export const getVariantSellPrice = variant => {
  const active_discount = pickBestActiveDiscount(variant)
  if (active_discount?.final_price != null) return active_discount.final_price
  return toNumber(variant?.price)
}

export const getFinalPrice = variant => {
  return getVariantSellPrice(variant)
}
