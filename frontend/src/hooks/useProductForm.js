import { useCallback, useEffect, useRef, useState } from 'react'
import {
  adminAttributeApi,
  adminBrandApi,
  adminCategoryApi
} from '../services/adminApi.js'

/** Số không âm từ input; không hợp lệ → null */
const parse_optional_money = raw => {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

const default_product_options = () => [
  { name: 'Phân loại', values: [{ value: 'Mặc định', images: [] }] }
]

const initial_create_variant = () => ({
  variant_id: undefined,
  option_selections: [0],
  sku: `SKU-${Date.now()}`,
  price: '',
  compare_price: '',
  cost_price: '',
  stock: 0
})

/** Chuẩn hoá options từ API (ảnh gắn theo giá trị tuỳ chọn) */
const normalize_options_from_api = raw => {
  const list = raw || []
  return [...list]
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        (a.option_id ?? 0) - (b.option_id ?? 0)
    )
    .map(opt_row => ({
      ...opt_row,
      values: [...(opt_row.values || [])]
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            (a.option_value_id ?? 0) - (b.option_value_id ?? 0)
        )
        .map(val_row => ({
          option_value_id: val_row.option_value_id,
          value: val_row.value ?? '',
          sort_order: val_row.sort_order ?? 0,
          images: Array.isArray(val_row.images)
            ? val_row.images.map(u => String(u ?? '').trim()).filter(Boolean)
            : []
        }))
    }))
}

/**
 * @param {object|null} initial_data — dữ liệu sản phẩm khi sửa
 * @param {{ edit_mode?: boolean }} form_opts — edit_mode: true trên trang Edit
 */
export function useProductForm(initial_data = null, form_opts = {}) {
  const { edit_mode = false } = form_opts

  const [form, setForm] = useState({
    name: '',
    description: '',
    /** Giá listing (Product.price); để trống = máy chủ lấy min variant */
    price: '',
    category_id: '',
    brand_id: ''
  })
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [attributes, setAttributes] = useState([])
  const [specs, setSpecs] = useState({})
  const [product_options, setProductOptions] = useState(() =>
    default_product_options()
  )
  const [variants, setVariants] = useState(() => [initial_create_variant()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const prev_category_ref = useRef(null)
  const prefill_specs_ref = useRef(false)
  const prefill_variants_ref = useRef(false)

  useEffect(() => {
    Promise.all([adminCategoryApi.getAll(), adminBrandApi.getAll()])
      .then(([cat_res, brand_res]) => {
        setCategories(cat_res.data.data || [])
        setBrands(brand_res.data.data || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    prefill_specs_ref.current = false
    prefill_variants_ref.current = false
  }, [initial_data?.product_id])

  useEffect(() => {
    if (!initial_data) return
    setForm({
      name: initial_data.name || '',
      description: initial_data.description || '',
      price:
        initial_data.listing_price != null &&
        initial_data.listing_price !== ''
          ? String(initial_data.listing_price)
          : '',
      category_id: initial_data.category?.category_id || '',
      brand_id: initial_data.brand?.brand_id || ''
    })
  }, [initial_data])

  useEffect(() => {
    if (!form.category_id || form.category_id === prev_category_ref.current) {
      return
    }
    prev_category_ref.current = form.category_id
    prefill_specs_ref.current = false

    // Trang tạo có matrix variants tự đồng bộ axes; reset ở đây làm chồng state với batched React
    if (!edit_mode) {
      prefill_variants_ref.current = false
    }

    setAttributes([])
    setSpecs({})

    adminAttributeApi
      .getByCategory(form.category_id)
      .then(res => {
        setAttributes(res.data.data || [])
      })
      .catch(() => {})
  }, [form.category_id, edit_mode])

  useEffect(() => {
    if (!initial_data || !attributes.length || prefill_specs_ref.current) {
      return
    }

    const spec_attr_ids = new Set(attributes.map(attr => attr.attribute_id))
    const next_specs = (initial_data.specs || []).reduce((acc, spec) => {
      if (spec_attr_ids.has(spec.attribute_id)) {
        acc[spec.attribute_id] = spec.value || ''
      }
      return acc
    }, {})

    setSpecs(next_specs)
    prefill_specs_ref.current = true
  }, [initial_data, attributes])

  useEffect(() => {
    if (!edit_mode || !initial_data?.product_id || prefill_variants_ref.current) {
      return
    }

    const normalized = normalize_options_from_api(
      initial_data.product_options
    )

    if (!normalized.length) {
      setProductOptions([])
      const loaded_empty = (initial_data.variants || []).map(variant => ({
        variant_id: variant.variant_id,
        sku: variant.sku || '',
        price:
          variant.sell_price != null ? String(variant.sell_price) : '',
        compare_price:
          variant.compare_at_price != null
            ? String(variant.compare_at_price)
            : '',
        cost_price:
          variant.cost_price != null ? String(variant.cost_price) : '',
        stock: Number(variant.stock ?? 0),
        option_value_ids: Array.isArray(variant.option_value_ids)
          ? [...variant.option_value_ids]
          : []
      }))
      setVariants(loaded_empty)
      prefill_variants_ref.current = true
      return
    }

    setProductOptions(normalized)

    const loaded = (initial_data.variants || []).map(variant => ({
      variant_id: variant.variant_id,
      sku: variant.sku || '',
      price: variant.sell_price != null ? String(variant.sell_price) : '',
      compare_price:
        variant.compare_at_price != null
          ? String(variant.compare_at_price)
          : '',
      cost_price:
        variant.cost_price != null ? String(variant.cost_price) : '',
      stock: Number(variant.stock ?? 0),
      option_value_ids: Array.isArray(variant.option_value_ids)
        ? [...variant.option_value_ids]
        : []
    }))

    if (loaded.length) {
      setVariants(loaded)
    } else {
      const default_ids = normalized
        .map(o => o.values[0]?.option_value_id)
        .filter(Boolean)
      setVariants([
        {
          variant_id: undefined,
          sku: `SKU-${Date.now()}`,
          price: '',
          compare_price: '',
          cost_price: '',
          stock: 0,
          option_value_ids:
            default_ids.length === normalized.length ? default_ids : []
        }
      ])
    }

    prefill_variants_ref.current = true
  }, [initial_data, edit_mode])

  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSpecChange = useCallback((attribute_id, value) => {
    setSpecs(prev => ({ ...prev, [attribute_id]: value }))
  }, [])

  const handleVariantRowChange = useCallback((index, field, value) => {
    setVariants(prev =>
      prev.map((variant_item, variant_index) =>
        variant_index === index
          ? { ...variant_item, [field]: value }
          : variant_item
      )
    )
  }, [])

  const handle_variant_option_change = useCallback(
    (variant_index, option_index, raw) => {
      if (edit_mode) {
        const id = Number(raw)
        setVariants(prev =>
          prev.map((v, i) => {
            if (i !== variant_index) return v
            const next = [...(v.option_value_ids || [])]
            next[option_index] = id
            return { ...v, option_value_ids: next }
          })
        )
        return
      }
      const idx = Number(raw)
      setVariants(prev =>
        prev.map((v, i) => {
          if (i !== variant_index) return v
          const next = [...(v.option_selections || [])]
          next[option_index] = idx
          return { ...v, option_selections: next }
        })
      )
    },
    [edit_mode]
  )

  /** Cập nhật danh sách URL ảnh của một giá trị tuỳ chọn (edit) */
  const patch_option_value_images = useCallback(
    (option_index, value_index, next_urls) => {
      setProductOptions(prev =>
        prev.map((opt, ai) =>
          ai !== option_index ?
            opt
          : {
              ...opt,
              values: opt.values.map((val, vi) =>
                vi !== value_index ?
                  val
                : { ...val, images: [...next_urls] }
              ),
            },
        ))
    },
    []
  )

  const append_option_value_images = useCallback(
    (option_index, value_index, urls_to_add) => {
      if (!Array.isArray(urls_to_add) || urls_to_add.length === 0) return
      setProductOptions(prev =>
        prev.map((opt, ai) =>
          ai !== option_index ?
            opt
          : {
              ...opt,
              values: opt.values.map((val, vi) => {
                if (vi !== value_index) return val
                const old = Array.isArray(val.images) ?
                    val.images
                  : [];
                const merged = [...old.filter(Boolean), ...urls_to_add]
                return { ...val, images: merged }
              }),
            },
        ))
    },
    []
  )

  const addVariantRow = useCallback(() => {
    const n = product_options.length

    setVariants(prev => {
      const sku_next = `SKU-${Date.now()}`

      if (edit_mode) {
        const defaults = product_options.map(
          o => o.values?.[0]?.option_value_id
        )
        const from_first = [...(prev[0]?.option_value_ids || [])]
        const ids_next =
          defaults.every(id => id !== undefined && id !== null) &&
          defaults.length === n
            ? defaults
            : from_first.length === n
              ? from_first
              : []
        return [
          ...prev,
          {
            variant_id: undefined,
            sku: sku_next,
            price: '',
            compare_price: '',
            cost_price: '',
            stock: 0,
            option_value_ids: ids_next
          }
        ]
      }

      const template = prev[0]
      const sel = [...(template?.option_selections || [])]
      while (sel.length < n) sel.push(0)

      return [
        ...prev,
        {
          variant_id: undefined,
          sku: sku_next,
          price: '',
          compare_price: '',
          cost_price: '',
          stock: 0,
          option_selections: sel.slice(0, n)
        }
      ]
    })
  }, [edit_mode, product_options])

  const removeVariantRow = useCallback(index => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handle_option_name_change = useCallback((option_index, name) => {
    setProductOptions(prev =>
      prev.map((o, i) => (i === option_index ? { ...o, name } : o))
    )
  }, [])

  const add_product_option = useCallback(() => {
    setProductOptions(prev => [
      ...prev,
      { name: '', values: [{ value: '', images: [] }] }
    ])
    setVariants(prev_v =>
      prev_v.map(v => ({
        ...v,
        option_selections: [...(v.option_selections || []), 0]
      }))
    )
  }, [])

  const remove_product_option = useCallback(option_index => {
    setProductOptions(prev => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== option_index)
    })
    setVariants(prev_v =>
      prev_v.map(v => ({
        ...v,
        option_selections: (v.option_selections || []).filter(
          (_, i) => i !== option_index
        )
      }))
    )
  }, [])

  const handle_option_value_change = useCallback(
    (option_index, value_index, value) => {
      setProductOptions(prev =>
        prev.map((o, i) =>
          i === option_index
            ? {
                ...o,
                values: o.values.map((val, vi) =>
                  vi === value_index ? { ...val, value } : val
                )
              }
            : o
        )
      )
    },
    []
  )

  const add_option_value = useCallback(option_index => {
    setProductOptions(prev =>
      prev.map((o, i) =>
        i === option_index ?
          { ...o, values: [...o.values, { value: '', images: [] }] }
        : o
      )
    )
  }, [])

  const remove_option_value = useCallback((option_index, value_index) => {
    setProductOptions(prev => {
      const o = prev[option_index]
      if (!o || o.values.length <= 1) return prev
      const new_vals = o.values.filter((_, j) => j !== value_index)
      return prev.map((opt, i) =>
        i === option_index ? { ...opt, values: new_vals } : opt
      )
    })

    setVariants(prev_v =>
      prev_v.map(v => {
        const s = [...(v.option_selections || [])]
        const cur = s[option_index]
        if (cur === undefined) return v
        if (cur === value_index) {
          s[option_index] = 0
        } else if (cur > value_index) {
          s[option_index] = cur - 1
        }
        return { ...v, option_selections: s }
      })
    )
  }, [])

  const buildPayload = useCallback(() => {
    const spec_attrs = attributes
    const specs_payload = spec_attrs
      .filter(a => specs[a.attribute_id]?.trim())
      .map(a => ({ attribute_id: a.attribute_id, value: specs[a.attribute_id] }))

    const base = {
      name: form.name,
      description: form.description || undefined,
      category_id: Number(form.category_id),
      brand_id: Number(form.brand_id),
      specs: specs_payload
    }

    const listing_num = Number(form.price)
    if (
      form.price !== '' &&
      Number.isFinite(listing_num) &&
      listing_num >= 0
    ) {
      base.price = listing_num
    }

    if (edit_mode) {
      const ov_imgs_payload = product_options.flatMap(po =>
        (po.values || [])
          .filter(val => val.option_value_id != null)
          .map(val => ({
            option_value_id: val.option_value_id,
            images: (Array.isArray(val.images)
              ? val.images
              : []
            ).map(u => String(u ?? '').trim()).filter(Boolean),
          }))
      )
      return {
        ...base,
        option_value_images: ov_imgs_payload,
        variants: variants.map(v => {
          const row = {
            sku: v.sku,
            stock: Number(v.stock ?? 0),
            price: Number(v.price),
            compare_price: parse_optional_money(v.compare_price),
            cost_price: parse_optional_money(v.cost_price),
          };
          if (v.variant_id) row.variant_id = v.variant_id
          if (product_options.length) {
            row.option_value_ids = Array.isArray(v.option_value_ids)
              ? v.option_value_ids
              : []
          }
          return row
        })
      }
    }

    const options_payload = product_options.map((opt, oi) => ({
      name: opt.name.trim(),
      sort_order: oi,
      values: opt.values.map((val, vi) => {
        const url_list = Array.isArray(val.images)
          ? val.images.map(u => String(u ?? '').trim()).filter(Boolean)
          : []
        const cell = {
          value: String(val.value ?? '').trim(),
          sort_order: vi,
        };
        return url_list.length ? { ...cell, images: url_list } : cell;
      }),
    }))

    const safe_nonneg_int = raw => {
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) return 0
      return Math.trunc(n)
    }
    const safe_nonneg_money = raw => {
      const n = Number(raw)
      return Number.isFinite(n) && n >= 0 ? n : 0
    }

    const variants_payload = variants.map(v => ({
      sku: v.sku,
      stock: safe_nonneg_int(v.stock),
      price: safe_nonneg_money(v.price),
      compare_price: parse_optional_money(v.compare_price),
      cost_price: parse_optional_money(v.cost_price),
      option_selections: (v.option_selections || []).map(sel =>
        Number.isFinite(Number(sel)) ? Math.max(0, Math.trunc(Number(sel))) : 0
      )
    }))

    return {
      ...base,
      product_options: options_payload,
      variants: variants_payload
    }
  }, [
    attributes,
    edit_mode,
    form,
    product_options,
    specs,
    variants
  ])

  /**
   * Lắp body POST tạo SP từ PO/variants đã sync (tránh closure cũ sau flushSync).
   */
  const assembleCreatePayloadFromSynced = useCallback(
    (synced_product_options, synced_variants_snap) => {
      const spec_attrs = attributes
      const specs_payload = spec_attrs
        .filter(a => specs[a.attribute_id]?.trim())
        .map(a => ({
          attribute_id: a.attribute_id,
          value: specs[a.attribute_id]
        }))

      const base_payload = {
        name: form.name,
        description: form.description || undefined,
        category_id: Number(form.category_id),
        brand_id: Number(form.brand_id),
        specs: specs_payload
      }

      const listing_num = Number(form.price)
      if (
        form.price !== '' &&
        Number.isFinite(listing_num) &&
        listing_num >= 0
      ) {
        base_payload.price = listing_num
      }

      const safe_nonneg_int = raw => {
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 0) return 0
        return Math.trunc(n)
      }
      const safe_nonneg_money = raw => {
        const n = Number(raw)
        return Number.isFinite(n) && n >= 0 ? n : 0
      }

      const options_payload = synced_product_options.map((opt, oi) => ({
        name: opt.name.trim(),
        sort_order: oi,
        values: opt.values.map((val, vi) => {
          const url_list = Array.isArray(val.images)
            ? val.images.map(u => String(u ?? '').trim()).filter(Boolean)
            : []
          const cell = {
            value: String(val.value ?? '').trim(),
            sort_order: vi
          }
          return url_list.length ? { ...cell, images: url_list } : cell
        })
      }))

      const variants_payload = synced_variants_snap.map(v => ({
        sku: String(v.sku ?? '').trim() || undefined,
        stock: safe_nonneg_int(v.stock),
        price: safe_nonneg_money(v.price),
        compare_price: parse_optional_money(v.compare_price),
        cost_price: parse_optional_money(v.cost_price),
        option_selections: (v.option_selections || []).map(sel =>
          Number.isFinite(Number(sel)) ? Math.max(0, Math.trunc(Number(sel))) : 0
        )
      }))

      return {
        ...base_payload,
        product_options: options_payload,
        variants: variants_payload
      }
    },
    [attributes, form, specs]
  )

  const replace_create_product_options = useCallback(
    next_options => {
      if (edit_mode) return
      setProductOptions(next_options)
    },
    [edit_mode]
  )

  const replace_create_variants = useCallback(
    next_variants => {
      if (edit_mode) return
      setVariants(prev_variants => {
        if (typeof next_variants === 'function') {
          return next_variants(prev_variants)
        }
        return next_variants
      })
    },
    [edit_mode]
  )

  return {
    form,
    categories,
    brands,
    attributes,
    specs,
    product_options,
    variants,
    loading,
    error,
    edit_mode,
    setLoading,
    setError,
    replace_create_product_options,
    replace_create_variants,
    handleFormChange,
    handleSpecChange,
    handleVariantRowChange,
    handle_variant_option_change,
    patch_option_value_images,
    append_option_value_images,
    addVariantRow,
    removeVariantRow,
    buildPayload,
    assembleCreatePayloadFromSynced,
    handle_option_name_change,
    add_product_option,
    remove_product_option,
    handle_option_value_change,
    add_option_value,
    remove_option_value
  }
}
