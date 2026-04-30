import { useEffect, useState } from 'react'
import ProductCard from '../../components/ProductCard.jsx'
import api from '../../services/api.js'

function ProductSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index_value) => (
        <div key={index_value} className='skeleton h-[360px] rounded-xl' />
      ))}
    </div>
  )
}

export default function CatalogPageTemplate({
  page_title,
  page_description,
  search_keyword,
  category_keyword
}) {
  const [product_list, setProductList] = useState([])
  const [is_loading, setIsLoading] = useState(true)
  const [error_message, setErrorMessage] = useState('')

  useEffect(() => {
    let is_cancelled = false

    const normalize_text = input_value => {
      return (input_value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
    }

    const fetch_product_list = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        let category_id = null

        if (category_keyword) {
          const category_response = await api.get('/categories')
          const category_list = category_response?.data?.data || []
          const normalized_keyword = normalize_text(category_keyword)

          const matched_category = category_list.find(category_item => {
            const normalized_name = normalize_text(category_item?.name)
            return normalized_name.includes(normalized_keyword)
          })

          category_id = matched_category?.category_id || null
        }

        const response_data = await api.get('/products', {
          params: {
            category_id: category_id || undefined,
            search: category_id ? undefined : search_keyword,
            limit: 24
          }
        })

        const payload_data = response_data?.data?.data
        const next_list = Array.isArray(payload_data)
          ? payload_data
          : payload_data?.items || []

        if (!is_cancelled) {
          setProductList(next_list)
        }
      } catch (error_value) {
        if (!is_cancelled) {
          setErrorMessage(error_value.message || 'Failed to load products')
        }
      } finally {
        if (!is_cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetch_product_list()

    return () => {
      is_cancelled = true
    }
  }, [search_keyword])

  return (
    <main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-10 pt-28 lg:px-6'>
      <header className='mb-6 rounded-xl border border-white/10 bg-[#0f0f1a] p-5'>
        <h1 className='text-2xl font-bold text-white'>{page_title}</h1>
        <p className='mt-2 text-sm text-slate-300'>{page_description}</p>
      </header>

      {is_loading && <ProductSkeleton />}

      {!is_loading && !!error_message && (
        <p className='rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300'>
          {error_message}
        </p>
      )}

      {!is_loading && !error_message && product_list.length === 0 && (
        <p className='rounded-xl border border-white/10 bg-[#0f0f1a] p-4 text-sm text-slate-300'>
          Chua co san pham phu hop trong danh muc nay.
        </p>
      )}

      {!is_loading && !error_message && product_list.length > 0 && (
        <section className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {product_list.map((product_item, index_value) => (
            <ProductCard
              key={product_item.product_id}
              product={product_item}
              index={index_value}
            />
          ))}
        </section>
      )}
    </main>
  )
}
