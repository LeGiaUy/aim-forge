/**
 * Bộ lọc danh mục: thương hiệu, khoảng giá, sắp xếp, tồn kho
 */
export default function CatalogFilters({
  brand_list,
  brand_id,
  on_brand_id_change,
  min_price,
  on_min_price_change,
  max_price,
  on_max_price_change,
  sort,
  on_sort_change,
  in_stock,
  on_in_stock_change,
  on_reset
}) {
  return (
    <section
      className='rounded-xl border border-white/10 bg-[#0f0f1a] p-4'
      aria-label='Bộ lọc sản phẩm'
    >
      <h2 className='mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
        Bộ lọc
      </h2>
      <div className='flex flex-col gap-3'>
        <div>
          <label
            className='mb-1 block text-xs text-[#94a3b8]'
            htmlFor='catalog-filter-brand'
          >
            Thương hiệu
          </label>
          <select
            id='catalog-filter-brand'
            value={brand_id}
            onChange={e => on_brand_id_change(e.target.value)}
            className='w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm
              text-slate-200 focus:border-violet-500/50 focus:outline-none'
          >
            <option value=''>Tất cả</option>
            {brand_list.map(b => (
              <option key={b.brand_id} value={b.brand_id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <div>
            <label
              className='mb-1 block text-xs text-[#94a3b8]'
              htmlFor='catalog-min-price'
            >
              Giá từ (₫)
            </label>
            <input
              id='catalog-min-price'
              type='number'
              min={0}
              inputMode='numeric'
              value={min_price}
              onChange={e => on_min_price_change(e.target.value)}
              placeholder='0'
              className='w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2
                text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none'
            />
          </div>
          <div>
            <label
              className='mb-1 block text-xs text-[#94a3b8]'
              htmlFor='catalog-max-price'
            >
              Đến (₫)
            </label>
            <input
              id='catalog-max-price'
              type='number'
              min={0}
              inputMode='numeric'
              value={max_price}
              onChange={e => on_max_price_change(e.target.value)}
              placeholder='—'
              className='w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2
                text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none'
            />
          </div>
        </div>

        <div>
          <label
            className='mb-1 block text-xs text-[#94a3b8]'
            htmlFor='catalog-sort'
          >
            Sắp xếp
          </label>
          <select
            id='catalog-sort'
            value={sort}
            onChange={e => on_sort_change(e.target.value)}
            className='w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm
              text-slate-200 focus:border-violet-500/50 focus:outline-none'
          >
            <option value='newest'>Mới nhất</option>
            <option value='price_asc'>Giá tăng dần</option>
            <option value='price_desc'>Giá giảm dần</option>
          </select>
        </div>

        <label className='flex cursor-pointer items-center gap-2 text-sm text-slate-300'>
          <input
            type='checkbox'
            checked={in_stock}
            onChange={e => on_in_stock_change(e.target.checked)}
            className='rounded border-white/20 bg-black/40 text-violet-500
              focus:ring-violet-500/40'
          />
          Chỉ sản phẩm còn hàng
        </label>

        <button
          type='button'
          onClick={on_reset}
          className='rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm
            text-slate-300 transition hover:border-violet-500/30 hover:text-white'
        >
          Xóa bộ lọc và tìm kiếm
        </button>
      </div>
    </section>
  )
}
