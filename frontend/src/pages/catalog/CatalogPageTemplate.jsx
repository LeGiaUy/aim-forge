import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CatalogFilters from '../../components/catalog/CatalogFilters.jsx'
import ProductCard from '../../components/ProductCard.jsx'
import api from '../../services/api.js'

function ProductSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 8 }).map((_, index_value) => (
        <div key={index_value} className='skeleton h-[360px] rounded-xl' />
      ))}
    </div>
  )
}

const normalize_text = input_value => {
  return (input_value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

const parse_price_param = value => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(String(value).replace(/\s/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export default function CatalogPageTemplate({
  page_title,
  page_description,
  search_keyword,
  category_keyword
}) {
  const [product_list, setProductList] = useState([])
  const [result_total, setResultTotal] = useState(null)
  const [is_loading, setIsLoading] = useState(true)
  const [error_message, setErrorMessage] = useState('')
  const [category_list, setCategoryList] = useState([])
  const [brand_list, setBrandList] = useState([])

  const [brand_id, setBrandId] = useState('')
  const [min_price, setMinPrice] = useState('')
  const [max_price, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [in_stock, setInStock] = useState(false)
  const [search_text, setSearchText] = useState('')
  const [search_debounced, setSearchDebounced] = useState('')

  const [search_params, set_search_params] = useSearchParams()
  const q_from_url = search_params.get('q') ?? ''

  useEffect(() => {
    setSearchText(q_from_url)
    setSearchDebounced(q_from_url)
  }, [q_from_url])

  const resolved_category_id = useMemo(() => {
    if (!category_keyword || category_list.length === 0) return null
    const needle = normalize_text(category_keyword)
    const matched = category_list.find(c =>
      normalize_text(c?.name).includes(needle)
    )
    return matched?.category_id ?? null
  }, [category_keyword, category_list])

  const effective_search = useMemo(() => {
    const user_q = search_debounced.trim()
    if (user_q) return user_q
    if (resolved_category_id) return undefined
    return search_keyword || undefined
  }, [search_debounced, resolved_category_id, search_keyword])

  useEffect(() => {
    const timer_id = setTimeout(() => {
      setSearchDebounced(search_text)
    }, 400)
    return () => clearTimeout(timer_id)
  }, [search_text])

  useEffect(() => {
    let cancel = false
    api
      .get('/categories')
      .then(res => {
        if (!cancel) setCategoryList(res?.data?.data || [])
      })
      .catch(() => {
        if (!cancel) setCategoryList([])
      })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    let cancel = false
    api
      .get('/brands')
      .then(res => {
        if (!cancel) setBrandList(res?.data?.data || [])
      })
      .catch(() => {
        if (!cancel) setBrandList([])
      })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    let is_cancelled = false

    const run = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const category_id = resolved_category_id

      let min_n = parse_price_param(min_price)
      let max_n = parse_price_param(max_price)
      if (min_n !== null && max_n !== null && min_n > max_n) {
        const t = min_n
        min_n = max_n
        max_n = t
      }

      const params = {
        category_id: category_id || undefined,
        search: effective_search,
        brand_id: brand_id || undefined,
        min_price: min_n !== null ? min_n : undefined,
        max_price: max_n !== null ? max_n : undefined,
        sort: sort === 'newest' ? undefined : sort,
        in_stock: in_stock ? 'true' : undefined,
        limit: 48
      }

      try {
        const response_data = await api.get('/products', { params })
        const payload_data = response_data?.data?.data
        const next_list = Array.isArray(payload_data)
          ? payload_data
          : payload_data?.items || []
        const total = payload_data?.pagination?.total

        if (!is_cancelled) {
          setProductList(next_list)
          setResultTotal(
            typeof total === 'number' ? total : next_list.length
          )
        }
      } catch (error_value) {
        if (!is_cancelled) {
          setErrorMessage(error_value.message || 'Không tải được sản phẩm')
          setProductList([])
          setResultTotal(0)
        }
      } finally {
        if (!is_cancelled) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      is_cancelled = true
    }
  }, [
    brand_id,
    effective_search,
    in_stock,
    max_price,
    min_price,
    resolved_category_id,
    sort
  ])

  const reset_filters = () => {
    setBrandId('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setInStock(false)
    setSearchText('')
    setSearchDebounced('')
    set_search_params(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        return next
      },
      { replace: true }
    )
  }

  return (
    <main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-10 pt-28 lg:px-6'>
      <header className='mb-6 rounded-xl border border-white/10 bg-[#0f0f1a] p-5'>
        <h1 className='text-2xl font-bold text-white'>{page_title}</h1>
        <p className='mt-2 text-sm text-slate-300'>{page_description}</p>
        {!is_loading && !error_message && result_total !== null && (
          <p className='mt-2 text-xs text-[#64748b]'>
            {result_total} sản phẩm
          </p>
        )}
      </header>

      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <aside className='w-full shrink-0 lg:sticky lg:top-28 lg:w-64'>
          <CatalogFilters
            brand_list={brand_list}
            brand_id={brand_id}
            on_brand_id_change={setBrandId}
            min_price={min_price}
            on_min_price_change={setMinPrice}
            max_price={max_price}
            on_max_price_change={setMaxPrice}
            sort={sort}
            on_sort_change={setSort}
            in_stock={in_stock}
            on_in_stock_change={setInStock}
            on_reset={reset_filters}
          />
        </aside>

        <div className='min-w-0 flex-1'>
          {is_loading && <ProductSkeleton />}

          {!is_loading && !!error_message && (
            <p className='rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300'>
              {error_message}
            </p>
          )}

          {!is_loading && !error_message && product_list.length === 0 && (
            <p className='rounded-xl border border-white/10 bg-[#0f0f1a] p-4 text-sm text-slate-300'>
              {search_debounced.trim()
                ? 'Không tìm thấy sản phẩm phù hợp với từ khóa và bộ lọc.'
                : 'Không có sản phẩm phù hợp trong danh mục này.'}
            </p>
          )}

          {!is_loading && !error_message && product_list.length > 0 && (
            <section className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
              {product_list.map((product_item, index_value) => (
                <ProductCard
                  key={product_item.product_id}
                  product={product_item}
                  index={index_value}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
