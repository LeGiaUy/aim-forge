/**
 * Product pricing: base → product discount → (future: flash sale → coupon)
 */

const toNumber = value => {
  if (value === null || value === undefined) return 0
  return Number(value)
}

export const isProductDiscountActive = (product, now = new Date()) => {
  if (!product || product.discount_price == null) return false

  const base = toNumber(product.base_price)
  const disc = toNumber(product.discount_price)
  if (!(disc < base)) return false

  const start = product.discount_start
    ? new Date(product.discount_start).getTime()
    : null
  const end = product.discount_end
    ? new Date(product.discount_end).getTime()
    : null
  if (start == null || end == null) return false

  const t = now.getTime()
  return t >= start && t <= end
}

export const getProductPrice = (product, now = new Date()) => {
  const base = toNumber(product?.base_price)
  if (!product) return base

  if (isProductDiscountActive(product, now)) {
    return toNumber(product.discount_price)
  }
  return base
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

export const getProductPricingPayload = (product, now = new Date()) => {
  const price = toNumber(product?.base_price)
  const active = isProductDiscountActive(product, now)
  const discNum = active ? toNumber(product.discount_price) : null
  const finalPrice = active ? discNum : price

  let discountAmount = null
  let discountPercent = null
  let discountPrice = null

  if (active && discNum != null) {
    discountPrice = discNum
    discountAmount = calculateSaving(price, discNum)
    discountPercent = calculateDiscountPercent(price, discNum)
  }

  return {
    price,
    final_price: finalPrice,
    discount_price: discountPrice,
    discount_amount: discountAmount,
    discount_percent: discountPercent
  }
}

export const getFinalPrice = (product, now = new Date(), _extra = {}) => {
  return getProductPrice(product, now)
}
