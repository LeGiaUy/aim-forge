/** Nhãn hiển thị variant (đồng bộ logic với backend variantDisplay.service) */

const normalize_archived_sku = raw => {
  const t = raw?.trim()
  if (!t) return null
  const ix = t.indexOf('-del-')
  if (ix <= 0) return t
  return t.slice(0, ix)
}

const attributes_from_cache_or_vov = variant => {
  const cache = variant?.options_cache
  if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
    return Object.entries(cache).map(([attribute, value]) => ({
      attribute,
      value: String(value ?? '')
    }))
  }
  const rows = (variant?.variant_option_values || [])
    .map(vov => ({
      attribute: vov.option_value?.option?.name,
      value: vov.option_value?.value,
      sort_opt: vov.option_value?.option?.sort_order ?? 0,
      sort_val: vov.option_value?.sort_order ?? 0
    }))
    .filter(r => r.attribute)
    .sort(
      (a, b) =>
        a.sort_opt - b.sort_opt ||
        String(a.attribute).localeCompare(String(b.attribute)) ||
        a.sort_val - b.sort_val
    )
  return rows.map(({ attribute, value }) => ({
    attribute,
    value: String(value ?? '')
  }))
}

/** Chuỗi một dòng cho giỏ / admin chi tiết đơn */
export function format_variant_label(variant) {
  if (!variant) return '—'
  const attrs = attributes_from_cache_or_vov(variant)
  if (attrs.length) {
    return attrs.map(a => `${a.attribute}: ${a.value}`).join(' / ')
  }
  const sku = normalize_archived_sku(variant.sku)
  if (sku) return sku
  return `#${variant.variant_id ?? '?'}`
}
