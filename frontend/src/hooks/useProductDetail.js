import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'

const getDefaultVariant = variants => {
  if (!variants?.length) return null
  return variants.find(item => item.stock > 0) || variants[0]
}

const normalizeProduct = raw_product => {
  if (!raw_product) return null

  const normalized_variants = (raw_product.variants || []).map(variant_item => ({
    ...variant_item,
    images: (variant_item.images_detail || variant_item.images || []).map(
      image_item =>
        typeof image_item === 'string'
          ? { image_url: image_item }
          : image_item
    ),
    attributes: (
      variant_item.attributes ||
      variant_item.attributes_detail ||
      []
    ).map(attribute_item => ({
      attribute: attribute_item.attribute,
      value: attribute_item.value,
      value_id: attribute_item.value_id
    })),
    stock: Number(variant_item.stock)
  }))

  const normalized_options = [...(raw_product.product_options || [])].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      (a.option_id ?? 0) - (b.option_id ?? 0)
  )

  return {
    ...raw_product,
    product_options: normalized_options,
    variants: normalized_variants
  }
}

export const useProductDetail = product_id => {
  const [product_data, setProductData] = useState(null)
  const [related_products, setRelatedProducts] = useState([])
  const [selected_variant, setSelectedVariant] = useState(null)
  const [selected_image, setSelectedImage] = useState('')
  const [loading_state, setLoadingState] = useState(true)
  const [error_message, setErrorMessage] = useState('')

  const fetchProductDetail = useCallback(async () => {
    setLoadingState(true)
    setErrorMessage('')

    try {
      const product_response = await api.get(`/products/${product_id}`)
      const normalized_product = normalizeProduct(product_response.data.data)

      setProductData(normalized_product)

      const default_variant = getDefaultVariant(normalized_product?.variants)
      setSelectedVariant(default_variant)
      setSelectedImage(default_variant?.images?.[0]?.image_url || '')

      if (normalized_product?.category?.category_id) {
        /** Cùng danh mục; nếu có thương hiệu thì thêm brand — tránh nhầm các dòng SKU khác hẳn */
        const related_params = {
          category_id: normalized_product.category.category_id,
          ...(normalized_product.brand?.brand_id != null ?
            { brand_id: normalized_product.brand.brand_id }
          : {})
        }
        const related_response = await api.get('/products', {
          params: related_params,
        })

        const related_data = related_response.data?.data
        const related_items = Array.isArray(related_data)
          ? related_data
          : Array.isArray(related_data?.items)
            ? related_data.items
            : []

        const filtered_products = related_items
          .filter(item => item.product_id !== normalized_product.product_id)
          .slice(0, 4)

        setRelatedProducts(filtered_products)
      } else {
        setRelatedProducts([])
      }
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải chi tiết sản phẩm')
    } finally {
      setLoadingState(false)
    }
  }, [product_id])

  useEffect(() => {
    fetchProductDetail()
  }, [fetchProductDetail])

  useEffect(() => {
    if (!selected_variant) return

    const next_image = selected_variant.images?.[0]?.image_url || ''
    setSelectedImage(next_image)
  }, [selected_variant])

  return {
    product_data,
    related_products,
    selected_variant,
    selected_image,
    loading_state,
    error_message,
    setSelectedVariant,
    setSelectedImage,
    refetch_product: fetchProductDetail
  }
}
