/**
 * Giá bán theo SKU: price = giá thực thu, compare_price = giá niêm (gạch ngang).
 */

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  return Number(value)
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
export const getVariantPricingPayload = (variant) => {
  const sell = toNumber(variant?.price)
  const compare = normalizeVariantComparePrice(sell, variant?.compare_price)
  const on_sale = compare != null
  const strike = on_sale ? compare : sell
  return {
    price: strike,
    final_price: sell,
    discount_price: on_sale ? sell : null,
    discount_amount: on_sale ? calculateSaving(compare, sell) : null,
    discount_percent: on_sale ? calculateDiscountPercent(compare, sell) : null,
  }
}

/**
 * Fallback khi chỉ có Product.price (listing), không có variant.
 */
export const getSimplePricingPayload = (amount) => {
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
export const getVariantSellPrice = (variant) => toNumber(variant?.price)

export const getFinalPrice = (variant) => getVariantSellPrice(variant)
