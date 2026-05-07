import { useMemo, useState } from 'react'

const ROW_HEIGHT = 44
const VIEWPORT_HEIGHT = 260
const OVERSCAN = 6

export default function ProductPicker({
  products,
  brands,
  categories,
  selected_ids,
  on_toggle,
  on_bulk_select,
  on_bulk_clear
}) {
  const [search, set_search] = useState('')
  const [filters, set_filters] = useState({ brand_id: '', category_id: '' })
  const [scroll_top, set_scroll_top] = useState(0)

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return products.filter(item => {
      if (
        filters.brand_id &&
        Number(item.brand?.brand_id || 0) !== Number(filters.brand_id)
      ) {
        return false
      }
      if (
        filters.category_id &&
        Number(item.category?.category_id || 0) !== Number(filters.category_id)
      ) {
        return false
      }
      if (!keyword) return true
      return String(item.name || '').toLowerCase().includes(keyword)
    })
  }, [products, search, filters])

  const total_rows = filtered.length
  const start_index = Math.max(0, Math.floor(scroll_top / ROW_HEIGHT) - OVERSCAN)
  const visible_count = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2
  const end_index = Math.min(total_rows, start_index + visible_count)
  const visible_rows = filtered.slice(start_index, end_index)
  const offset_y = start_index * ROW_HEIGHT

  return (
    <section className='rounded-xl border border-white/10 bg-[#090913] p-3'>
      <div className='sticky top-0 z-10 space-y-2 bg-[#090913] pb-2'>
        <p className='admin-label'>Áp dụng cho sản phẩm</p>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          <select
            value={filters.brand_id}
            onChange={event =>
              set_filters(prev => ({ ...prev, brand_id: event.target.value }))
            }
            className='admin-select'
            aria-label='Lọc sản phẩm theo thương hiệu'
          >
            <option value=''>Lọc thương hiệu</option>
            {brands.map(item => (
              <option key={item.brand_id} value={item.brand_id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={filters.category_id}
            onChange={event =>
              set_filters(prev => ({ ...prev, category_id: event.target.value }))
            }
            className='admin-select'
            aria-label='Lọc sản phẩm theo danh mục'
          >
            <option value=''>Lọc danh mục</option>
            {categories.map(item => (
              <option key={item.category_id} value={item.category_id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <input
          value={search}
          onChange={event => set_search(event.target.value)}
          className='admin-input w-full'
          placeholder='Tìm sản phẩm theo tên'
          aria-label='Tìm sản phẩm'
        />
        <div className='flex items-center justify-between text-xs text-[#94a3b8]'>
          <span>{filtered.length} kết quả, đã chọn {selected_ids.length}</span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='admin-btn-ghost !px-2 !py-1'
              onClick={() => on_bulk_select(filtered.map(item => item.product_id))}
            >
              Chọn tất cả lọc
            </button>
            <button
              type='button'
              className='admin-btn-ghost !px-2 !py-1'
              onClick={() => on_bulk_clear(filtered.map(item => item.product_id))}
            >
              Bỏ tất cả lọc
            </button>
          </div>
        </div>
      </div>

      <div
        className='mt-2 overflow-auto rounded-lg border border-white/10'
        style={{ maxHeight: VIEWPORT_HEIGHT }}
        onScroll={event => set_scroll_top(event.currentTarget.scrollTop)}
      >
        <div style={{ height: total_rows * ROW_HEIGHT }} className='relative'>
          <div style={{ transform: `translateY(${offset_y}px)` }}>
            {visible_rows.map(item => (
              <label
                key={item.product_id}
                className='grid h-11 cursor-pointer grid-cols-[24px_1fr_120px_120px_90px] items-center gap-2 border-b border-white/5 px-2 text-xs text-[#cbd5e1] hover:bg-white/5'
              >
                <input
                  type='checkbox'
                  checked={selected_ids.includes(item.product_id)}
                  onChange={() => on_toggle(item.product_id)}
                  aria-label={`Chọn sản phẩm ${item.name}`}
                />
                <span className='truncate'>{item.name}</span>
                <span className='truncate text-[#94a3b8]'>
                  {item.brand?.name || '—'}
                </span>
                <span className='truncate text-[#94a3b8]'>
                  {item.category?.name || '—'}
                </span>
                <span className='text-right text-[#94a3b8]'>
                  {item.total_stock || 0}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
