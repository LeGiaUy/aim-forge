import { useCallback, useEffect, useRef, useState } from 'react'
import { adminAttributeApi, adminBrandApi, adminCategoryApi } from '../services/adminApi.js'

const to_local_datetime_input = date_value => {
  if (!date_value) return ''

  const date_object = new Date(date_value)
  if (Number.isNaN(date_object.getTime())) return ''

  const pad_2 = value => String(value).padStart(2, '0')

  const year = date_object.getFullYear()
  const month = pad_2(date_object.getMonth() + 1)
  const day = pad_2(date_object.getDate())
  const hour = pad_2(date_object.getHours())
  const minute = pad_2(date_object.getMinutes())

  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function useProductForm(initial_data = null) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    discount_start: '',
    discount_end: '',
    category_id: '',
    brand_id: ''
  })
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [attributes, setAttributes] = useState([]) // all attributes for category
  const [specs, setSpecs] = useState({}) // { attribute_id: value }
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const prev_category_ref = useRef(null)
  const prefill_specs_ref = useRef(false)
  const prefill_data_ref = useRef(false)

  // Load dropdowns
  useEffect(() => {
    Promise.all([adminCategoryApi.getAll(), adminBrandApi.getAll()])
      .then(([cat_res, brand_res]) => {
        setCategories(cat_res.data.data || [])
        setBrands(brand_res.data.data || [])
      })
      .catch(() => {})
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (!initial_data) return
    prefill_specs_ref.current = false
    prefill_data_ref.current = false
    setForm({
      name: initial_data.name || '',
      description: initial_data.description || '',
      price: String(initial_data.price ?? ''),
      discount_price: String(initial_data.discount_price ?? ''),
      discount_start: to_local_datetime_input(initial_data.discount_start),
      discount_end: to_local_datetime_input(initial_data.discount_end),
      category_id: initial_data.category?.category_id || '',
      brand_id: initial_data.brand?.brand_id || ''
    })
  }, [initial_data])

  // Fetch attributes when category changes
  useEffect(() => {
    if (!form.category_id || form.category_id === prev_category_ref.current) return
    prev_category_ref.current = form.category_id
    prefill_specs_ref.current = false
    prefill_data_ref.current = false

    setAttributes([])
    setSpecs({})
    setVariants([])

    adminAttributeApi.getByCategory(form.category_id)
      .then(res => {
        const attrs = res.data.data || []
        setAttributes(attrs)
      })
      .catch(() => {})
  }, [form.category_id])

  // Prefill SPEC values for edit mode after category attributes are loaded
  useEffect(() => {
    if (!initial_data || !attributes.length || prefill_specs_ref.current) return

    const spec_attr_ids = new Set(
      attributes.map(attr => attr.attribute_id)
    )

    const next_specs = (initial_data.specs || []).reduce((acc, spec) => {
      if (spec_attr_ids.has(spec.attribute_id)) {
        acc[spec.attribute_id] = spec.value || ''
      }
      return acc
    }, {})

    setSpecs(next_specs)
    prefill_specs_ref.current = true
  }, [initial_data, attributes])

  // Prefill variants for edit mode
  useEffect(() => {
    if (!initial_data || !attributes.length || prefill_data_ref.current) return

    const initial_variants = (initial_data.variants || []).map(variant => {
      return {
        variant_id: variant.variant_id,
        color: variant.color || '',
        sku: variant.sku || '',
        stock: Number(variant.stock ?? 0),
        images: variant.images?.length ? variant.images : ['']
      }
    })

    if (initial_variants.length > 0) {
      setVariants(initial_variants)
    }
    prefill_data_ref.current = true
  }, [initial_data, attributes])

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

  const handleVariantImageChange = useCallback((variant_index, img_index, value) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variant_index) return v
      const new_images = [...v.images]
      new_images[img_index] = value
      return { ...v, images: new_images }
    }))
  }, [])

  const addVariantImage = useCallback((variant_index) => {
    setVariants(prev => prev.map((v, i) =>
      i === variant_index ? { ...v, images: [...v.images, ''] } : v
    ))
  }, [])

  const removeVariantImage = useCallback((variant_index, img_index) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variant_index) return v
      const new_images = v.images.filter((_, ii) => ii !== img_index)
      return { ...v, images: new_images.length ? new_images : [''] }
    }))
  }, [])

  const appendVariantImages = useCallback((variant_index, image_urls) => {
    if (!Array.isArray(image_urls) || image_urls.length === 0) return

    setVariants(prev =>
      prev.map((variant_item, index_value) => {
        if (index_value !== variant_index) return variant_item

        const old_images = variant_item.images.filter(Boolean)
        return { ...variant_item, images: [...old_images, ...image_urls] }
      })
    )
  }, [])

  const addVariantRow = useCallback(() => {
    setVariants(prev => [
      ...prev,
      {
        variant_id: undefined,
        color: '',
        sku: `SKU-${Date.now()}`,
        stock: 0,
        images: ['']
      }
    ])
  }, [])

  const removeVariantRow = useCallback(index => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }, [])

  const buildPayload = () => {
    const spec_attrs = attributes
    const specs_payload = spec_attrs
      .filter(a => specs[a.attribute_id]?.trim())
      .map(a => ({ attribute_id: a.attribute_id, value: specs[a.attribute_id] }))

    const variants_payload = variants.map(v => {
      const payload = {
        color: v.color?.trim() || '',
        sku: v.sku,
        stock: Number(v.stock),
        images: v.images.filter(img => img.trim())
      }

      if (v.variant_id) {
        payload.variant_id = v.variant_id
      }

      return payload
    })

    return {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      discount_start: form.discount_start
        ? new Date(form.discount_start).toISOString()
        : null,
      discount_end: form.discount_end
        ? new Date(form.discount_end).toISOString()
        : null,
      category_id: Number(form.category_id),
      brand_id: Number(form.brand_id),
      specs: specs_payload,
      variants: variants_payload
    }
  }

  return {
    form,
    categories,
    brands,
    attributes,
    specs,
    variants,
    loading,
    error,
    setLoading,
    setError,
    handleFormChange,
    handleSpecChange,
    handleVariantRowChange,
    handleVariantImageChange,
    addVariantImage,
    removeVariantImage,
    appendVariantImages,
    addVariantRow,
    removeVariantRow,
    buildPayload
  }
}
