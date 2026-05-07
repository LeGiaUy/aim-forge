import { useMemo, useState } from 'react'

const format_options = row => {
  const cache = row.options_cache || {}
  return Object.entries(cache)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' • ')
}

export default function VariantPicker({
  variants,
  products,
  selected_ids,
  on_toggle,
  on_bulk_select,
  on_bulk_clear
}) {
  const [search, set_search] = useState('')
  const [filters, set_filters] = useState({
    product_id: '',
    in_stock_only: false,
    low_stock_only: false
  })

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return variants.filter(item => {
      if (
        filters.product_id &&
        Number(item.product_id || 0) !== Number(filters.product_id)
      ) {
        return false
      }
      if (filters.in_stock_only && Number(item.stock || 0) <= 0) return false
      if (filters.low_stock_only && Number(item.stock || 0) > 5) return false
      if (!keyword) return true
      const option_text = format_options(item).toLowerCase()
      return (
        String(item.sku || '').toLowerCase().includes(keyword) ||
        String(item.product_name || '').toLowerCase().includes(keyword) ||
        option_text.includes(keyword)
      )
    })
  }, [variants, search, filters])

  return (
    <section className='rounded-xl border border-white/10 bg-[#090913] p-3'>
      <p className='admin-label'>Áp dụng cho biến thể</p>
      <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
        <select
          value={filters.product_id}
          onChange={event =>
            set_filters(prev => ({ ...prev, product_id: event.target.value }))
          }
          className='admin-select'
          aria-label='Lọc biến thể theo sản phẩm'
        >
          <option value=''>Lọc theo sản phẩm</option>
          {products.map(item => (
            <option key={item.product_id} value={item.product_id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={event => set_search(event.target.value)}
          className='admin-input'
          placeholder='Tìm theo SKU / option'
          aria-label='Tìm biến thể'
        />
      </div>
      <div className='mt-2 flex flex-wrap items-center gap-2'>
        <label className='inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-[#cbd5e1]'>
          <input
            type='checkbox'
            checked={filters.in_stock_only}
            onChange={event =>
              set_filters(prev => ({ ...prev, in_stock_only: event.target.checked }))
            }
          />
          Còn hàng
        </label>
        <label className='inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-[#cbd5e1]'>
          <input
            type='checkbox'
            checked={filters.low_stock_only}
            onChange={event =>
              set_filters(prev => ({
                ...prev,
                low_stock_only: event.target.checked
              }))
            }
          />
          Low stock (≤5)
        </label>
        <button
          type='button'
          className='admin-btn-ghost !px-2 !py-1 text-xs'
          onClick={() => on_bulk_select(filtered.map(item => item.variant_id))}
        >
          Chọn tất cả lọc
        </button>
        <button
          type='button'
          className='admin-btn-ghost !px-2 !py-1 text-xs'
          onClick={() => on_bulk_clear(filtered.map(item => item.variant_id))}
        >
          Bỏ tất cả lọc
        </button>
      </div>

      <div className='mt-2 max-h-[280px] space-y-2 overflow-auto rounded-lg border border-white/10 p-2'>
        {filtered.map(item => (
          <label
            key={item.variant_id}
            className='block cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs hover:border-cyan-500/40'
          >
            <div className='flex items-start gap-2'>
              <input
                type='checkbox'
                checked={selected_ids.includes(item.variant_id)}
                onChange={() => on_toggle(item.variant_id)}
                aria-label={`Chọn biến thể ${item.sku}`}
              />
              <div className='flex-1 space-y-0.5'>
                <p className='font-medium text-white'>{item.product_name}</p>
                <p className='text-[#94a3b8]'>{format_options(item) || 'Không có option'}</p>
                <div className='flex items-center gap-3 text-[#94a3b8]'>
                  <span>SKU: {item.sku || `#${item.variant_id}`}</span>
                  <span>Stock: {item.stock || 0}</span>
                  <span>Price: {item.price || 0}</span>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}
