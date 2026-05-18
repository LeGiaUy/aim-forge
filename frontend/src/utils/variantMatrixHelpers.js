import { generateVariants } from './generateVariants.js'

/** Khóa ổn định cho một combo giá trị */
export function combo_key_from_labels(labels) {
  return labels.join('\u0000')
}

const slug_chunk = s =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()

/**
 * SKU gợi ý từ combo giá trị tùy chọn
 */
export function auto_variant_sku(combo, prefix = '') {
  const parts = combo.map(slug_chunk).filter(Boolean)
  const base = parts.length ? parts.join('-') : 'SKU'
  return prefix ? `${prefix}-${base}` : base
}

/** SKU mặc định: namespace phiên + slug combo + chỉ số (tránh trùng @unique) */
export function build_default_variant_sku({
  combo,
  combo_index = 0,
  sku_namespace = '',
}) {
  const ns = String(sku_namespace || '').trim()
  const slug = auto_variant_sku(combo)
  const seq = String(combo_index + 1)
  return [ns, slug, seq].filter(Boolean).join('-')
}

/**
 * axes: { name, values: string[] }[]
 * Returns product_options shape for useProductForm
 */
export function axes_to_product_options(axes) {
  return axes.map((ax, oi) => ({
    name: ax.name.trim() || `Option ${oi + 1}`,
    values: ax.values
      .map(v => String(v).trim())
      .filter(Boolean)
      .map((value, vi) => {
        const imgs =
          oi === 0 ?
            (
              ax.value_images?.[value] ||
              []
            ).map(u => String(u).trim()).filter(Boolean)
          : [];
        const base = {
          value,
          sort_order: vi
        };
        if (imgs.length) base.images = imgs;
        return base;
      }),
  }))
}

/**
 * Tạo lại danh sách variant sau khi đổi options; giữ SKU/giá/tồn theo combo trùng
 */
export function regenerate_variants_matrix({
  axes,
  prev_product_options,
  prev_variants,
  default_price = '',
  sku_namespace = '',
}) {
  const value_matrix = axes.map(a =>
    a.values.map(v => String(v).trim()).filter(Boolean)
  )
  const combos = generateVariants(value_matrix)
  if (!combos.length) return []

  const default_price_str =
    default_price !== undefined && default_price !== null
      ? String(default_price).trim()
      : ''

  const prev_map = new Map()
  for (const v of prev_variants || []) {
    const labels = (v.option_selections || []).map((si, i) =>
      String(prev_product_options[i]?.values[si]?.value ?? '').trim()
    )
    prev_map.set(combo_key_from_labels(labels), v)
  }

  return combos.map((combo, combo_i) => {
    const k = combo_key_from_labels(combo)
    const prev = prev_map.get(k)
    const option_selections = combo.map((val, axis_i) => {
      const idx = value_matrix[axis_i].indexOf(val)
      return idx >= 0 ? idx : 0
    })
    const stock_num =
      prev?.stock !== undefined && prev?.stock !== ''
        ? Number(prev.stock)
        : 0
    const base_sku =
      prev?.sku?.trim() ||
      build_default_variant_sku({
        combo,
        combo_index: combo_i,
        sku_namespace,
      })
    return {
      variant_id: undefined,
      option_selections,
      sku: base_sku,
      price:
        prev?.price !== undefined &&
        prev?.price !== '' &&
        String(prev.price).trim() !== ''
          ? String(prev.price)
          : default_price_str,
      stock: Number.isFinite(stock_num) ? stock_num : 0,
      compare_price:
        prev?.compare_price !== undefined ? String(prev.compare_price) : '',
      cost_price:
        prev?.cost_price !== undefined ? String(prev.cost_price) : ''
    }
  })
}

/** axes từ product_options hiện tại (create) */
export function product_options_to_axes(product_options) {
  return (product_options || []).map((o, oi) => {
    const values_list = (o.values || []).map(v =>
      String(v.value ?? '').trim()
    );
    /** Trục 0 + map ảnh theo nhãn (màu) */
    let value_images = {};
    if (oi === 0) {
      for (const raw_val of o.values || []) {
        const label = String(raw_val.value ?? '').trim();
        if (!label) continue;
        const urls = Array.isArray(raw_val.images)
          ? raw_val.images.map(u => String(u).trim()).filter(Boolean)
          : [];
        if (urls.length) value_images = { ...value_images, [label]: urls };
      }
    }
    const base = {
      name: o.name || '',
      values: values_list
    };
    if (
      oi === 0 &&
      Object.keys(value_images).length > 0
    ) base.value_images = value_images;
    return base;
  });
}
