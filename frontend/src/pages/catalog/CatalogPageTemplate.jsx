import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CatalogFilters from '../../components/catalog/CatalogFilters.jsx'
import ProductCard from '../../components/ProductCard.jsx'
import api from '../../services/api.js'
import { formatVnd } from '../../utils/currency.js'

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

const map_featured_product = product_item => {
  if (!product_item) return null
  const original_price = product_item.price ?? null
  const final_price =
    product_item.final_price ??
    product_item.representative_variant?.final_price ??
    original_price
  const discount_amount = product_item.discount_amount ?? 0

  return {
    product_id: product_item.product_id,
    name: product_item.name,
    image_url: product_item.representative_variant?.main_image?.image_url || '',
    price:
      final_price !== null && final_price !== undefined
        ? formatVnd(final_price)
        : 'Liên hệ',
    original_price:
      discount_amount > 0 &&
      original_price !== null &&
      original_price !== undefined &&
      final_price < original_price
        ? formatVnd(original_price)
        : ''
  }
}

export default function CatalogPageTemplate({
  page_title,
  page_description,
  search_keyword,
  category_keyword,
  banner_background,
  featured_product
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

  const featured_product_data = useMemo(() => {
    if (product_list.length > 0) {
      const sorted_product_list = [...product_list].sort((a, b) => {
        const a_discount = Number(a.discount_amount || 0)
        const b_discount = Number(b.discount_amount || 0)
        if (b_discount !== a_discount) return b_discount - a_discount

        const a_final = Number(a.final_price ?? a.price ?? 0)
        const b_final = Number(b.final_price ?? b.price ?? 0)
        return b_final - a_final
      })

      const in_stock_featured = sorted_product_list.find(
        item => (item.representative_variant?.stock || 0) > 0
      )
      return map_featured_product(in_stock_featured || sorted_product_list[0])
    }

    return featured_product || null
  }, [featured_product, product_list])

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
      <header className='mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1a]'>
        <div
          className='relative min-h-[240px] p-5 sm:p-6 lg:min-h-[480px] lg:p-8'
          style={
            banner_background
              ? {
                  backgroundImage: `linear-gradient(
                    90deg,
                    rgba(3, 7, 18, 0.86) 0%,
                    rgba(3, 7, 18, 0.76) 42%,
                    rgba(3, 7, 18, 0.48) 68%,
                    rgba(3, 7, 18, 0.28) 100%
                  ), url(${banner_background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }
              : undefined
          }
        >
          <div className='max-w-2xl rounded-2xl bg-black/35 p-4 backdrop-blur-sm sm:p-5'>
            <h1 className='text-2xl font-bold text-white sm:text-3xl'>
              {page_title}
            </h1>
            <p className='mt-2 text-sm leading-7 text-slate-200 sm:text-[15px]'>
              {page_description}
            </p>
            {!is_loading && !error_message && result_total !== null && (
              <p className='mt-3 text-xs text-slate-300'>{result_total} sản phẩm</p>
            )}
          </div>

          {featured_product_data && (
            <aside className='mt-4 w-full max-w-xs lg:absolute lg:bottom-6 lg:right-6 lg:mt-0'>
              {featured_product_data.product_id ? (
                <Link
                  to={`/product/${featured_product_data.product_id}`}
                  className='block rounded-xl border border-white/15 bg-black/45 p-4 backdrop-blur-sm transition hover:border-cyan-300/60'
                >
                  <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-300'>
                    Sản phẩm nổi bật
                  </p>
                  {featured_product_data.image_url && (
                    <div className='mt-3 h-full overflow-hidden rounded-lg border border-white/10 bg-black/30'>
                      <img
                        src={featured_product_data.image_url}
                        alt={featured_product_data.name}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                    </div>
                  )}
                  <p className='mt-2 text-sm font-semibold leading-6 text-white'>
                    {featured_product_data.name}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='text-sm font-semibold text-red-400'>
                      {featured_product_data.price}
                    </span>
                    {featured_product_data.original_price && (
                      <span className='text-xs text-slate-400 line-through'>
                        {featured_product_data.original_price}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <div className='rounded-xl border border-white/15 bg-black/45 p-4 backdrop-blur-sm'>
                  <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-300'>
                    Sản phẩm nổi bật
                  </p>
                  <p className='mt-2 text-sm font-semibold leading-6 text-white'>
                    {featured_product_data.name}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='text-sm font-semibold text-red-400'>
                      {featured_product_data.price}
                    </span>
                    {featured_product_data.original_price && (
                      <span className='text-xs text-slate-400 line-through'>
                        {featured_product_data.original_price}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
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
