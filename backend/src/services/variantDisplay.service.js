/**
 * Chuỗi hiển thị variant (đơn, giỏ): từ options_cache hoặc quan hệ VOV.
 */

export const normalizeSkuForDisplay = (raw_sku) => {
  const sku_text = raw_sku?.trim()
  if (!sku_text) return null

  const archived_ix = sku_text.indexOf('-del-')
  if (archived_ix <= 0) return sku_text
  return sku_text.slice(0, archived_ix)
}

/**
 * @param {object} variant — Prisma ProductVariant có thể có options_cache Json,
 *   variant_option_values[].option_value.option.name|value
 * @returns {{ attribute: string, value: string }[]}
 */
export const buildVariantAttributesList = (variant) => {
  const cache = variant?.options_cache
  if (
    cache &&
    typeof cache === 'object' &&
    !Array.isArray(cache)
  ) {
    return Object.entries(cache).map(([attribute, value]) => ({
      attribute,
      value: String(value ?? '')
    }))
  }

  const rows = (variant?.variant_option_values || [])
    .map((vov) => ({
      attribute: vov.option_value?.option?.name,
      value: vov.option_value?.value,
      sort_opt: vov.option_value?.option?.sort_order ?? 0,
      sort_val: vov.option_value?.sort_order ?? 0
    }))
    .filter((r) => r.attribute)
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

/** Một dòng nhãn: "Màu: Đen / Size: XL" hoặc SKU / mặc định */
export const buildVariantDisplayName = (variant) => {
  const attrs = buildVariantAttributesList(variant)
  if (attrs.length) {
    return attrs.map((a) => `${a.attribute}: ${a.value}`).join(' / ')
  }
  const sku = normalizeSkuForDisplay(variant?.sku)
  if (sku) return sku
  return 'Default variant'
}

/** Tương thích field variant_color khi có trục tên Color/Màu */
export const deriveLegacyVariantColor = (attrs) => {
  const hit = attrs.find((a) =>
    /^color$/i.test(String(a.attribute)) ||
    /^màu$/i.test(String(a.attribute))
  )
  return hit?.value ?? null
}

/**
 * Gallery: trục ProductOption có sort_order nhỏ nhất (vd. đặt Màu lên đầu).
 * @param {object} variant — include variant_option_values.option_value.images|option
 * @returns {object[]} OptionValueImage rows đã sort
 */
export const getGalleryImagesForVariant = (variant) => {
  const links = variant?.variant_option_values || []
  const sorted_links = [...links].sort((a, b) => {
    const ao = a.option_value?.option?.sort_order ?? 0
    const bo = b.option_value?.option?.sort_order ?? 0
    if (ao !== bo) return ao - bo
    const ai = a.option_value?.option?.option_id ?? 0
    const bi = b.option_value?.option?.option_id ?? 0
    return ai - bi
  })
  const first_ov = sorted_links[0]?.option_value
  const imgs = first_ov?.images
  if (!imgs?.length) return []
  return [...imgs].sort(
    (x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0)
  )
}

/** Một URL đại diện (thumbnail giỏ / đơn) */
export const getMainGalleryImageUrl = (variant) => {
  const list = getGalleryImagesForVariant(variant)
  const main_hit = list.find((i) => i.is_main)
  return (main_hit || list[0])?.image_url ?? null
}
