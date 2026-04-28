import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api.js'

const getDefaultVariant = variants => {
  if (!variants?.length) return null
  return variants.find(item => item.stock > 0) || variants[0]
}

const normalizeProduct = raw_product => {
  if (!raw_product) return null

  const normalized_variants = (raw_product.variants || []).map(variant_item => ({
    ...variant_item,
    price: Number(variant_item.price),
    stock: Number(variant_item.stock)
  }))

  return {
    ...raw_product,
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
        const related_response = await api.get('/products', {
          params: { category_id: normalized_product.category.category_id }
        })

        const filtered_products = (related_response.data.data || [])
          .filter(item => item.product_id !== normalized_product.product_id)
          .slice(0, 4)

        setRelatedProducts(filtered_products)
      } else {
        setRelatedProducts([])
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load product detail')
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

  const lowest_price = useMemo(() => {
    if (!product_data?.variants?.length) return null

    return product_data.variants.reduce((current_min, current_item) => {
      return current_item.price < current_min ? current_item.price : current_min
    }, product_data.variants[0].price)
  }, [product_data])

  return {
    product_data,
    related_products,
    selected_variant,
    selected_image,
    loading_state,
    error_message,
    lowest_price,
    setSelectedVariant,
    setSelectedImage,
    refetch_product: fetchProductDetail
  }
}
