import { useMemo } from 'react'
import ProductPicker from './ProductPicker.jsx'
import VariantPicker from './VariantPicker.jsx'

const get_schedule_status = (start_at, end_at, is_active) => {
  if (!is_active) return 'Inactive'
  const now = Date.now()
  const start_ts = start_at ? new Date(start_at).getTime() : now
  const end_ts = end_at ? new Date(end_at).getTime() : null
  if (now < start_ts) return 'Upcoming'
  if (end_ts != null && now > end_ts) return 'Expired'
  return 'Active'
}

export default function DiscountForm({
  editing_id,
  form,
  set_form,
  scope_mode,
  set_scope_mode,
  products,
  brands,
  categories,
  variants,
  on_preview,
  on_submit,
  saving,
  on_reset,
  on_bulk_select,
  on_bulk_clear,
  on_remove_selected
}) {
  const warnings = useMemo(() => {
    const list = []
    const value_num = Number(form.value || 0)
    if (form.type === 'PERCENT' && value_num > 90) {
      list.push('Discount phần trăm vượt quá 90%')
    }
    if (form.end_at && form.start_at && new Date(form.end_at) < new Date(form.start_at)) {
      list.push('Thời gian kết thúc nhỏ hơn thời gian bắt đầu')
    }
    if (scope_mode === 'products' && form.product_ids.length === 0) {
      list.push('Scope products đang rỗng')
    }
    if (scope_mode === 'variants' && form.variant_ids.length === 0) {
      list.push('Scope variants đang rỗng')
    }
    if (Number(form.min_final_price || 0) <= 0) {
      list.push('Giá tối thiểu nên lớn hơn 0 để tránh final price bằng 0')
    }
    return list
  }, [form, scope_mode])

  const schedule_status = get_schedule_status(
    form.start_at,
    form.end_at,
    form.is_active
  )

  return (
    <section className='admin-card'>
      <h2 className='admin-section-title'>
        {editing_id ? `Cập nhật #${editing_id}` : 'Tạo chương trình mới'}
      </h2>
      <form onSubmit={on_submit} className='space-y-5'>
        <div className='rounded-xl border border-white/10 p-4'>
          <h3 className='mb-3 text-sm font-semibold text-white'>Basic Info</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
            <input
              value={form.name}
              onChange={event =>
                set_form(prev => ({ ...prev, name: event.target.value }))
              }
              className='admin-input'
              placeholder='Tên campaign'
              aria-label='Tên campaign'
            />
            <select
              value={form.type}
              onChange={event =>
                set_form(prev => ({ ...prev, type: event.target.value }))
              }
              className='admin-select'
              aria-label='Kiểu discount'
            >
              <option value='PERCENT'>Theo phần trăm</option>
              <option value='FIXED'>Giảm cố định</option>
            </select>
            <input
              type='number'
              min='1'
              value={form.value}
              onChange={event =>
                set_form(prev => ({ ...prev, value: event.target.value }))
              }
              className='admin-input'
              placeholder='Giá trị'
              aria-label='Giá trị discount'
            />
            <label className='inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#cbd5e1]'>
              <input
                type='checkbox'
                checked={form.is_active}
                onChange={event =>
                  set_form(prev => ({ ...prev, is_active: event.target.checked }))
                }
              />
              Active
            </label>
          </div>
        </div>

        <div className='rounded-xl border border-white/10 p-4'>
          <h3 className='mb-3 text-sm font-semibold text-white'>Schedule</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div>
              <label className='admin-label'>Start</label>
              <input
                type='datetime-local'
                value={form.start_at}
                onChange={event =>
                  set_form(prev => ({ ...prev, start_at: event.target.value }))
                }
                className='admin-input w-full'
              />
            </div>
            <div>
              <label className='admin-label'>End</label>
              <input
                type='datetime-local'
                value={form.end_at}
                onChange={event =>
                  set_form(prev => ({ ...prev, end_at: event.target.value }))
                }
                className='admin-input w-full'
              />
            </div>
            <div>
              <label className='admin-label'>Status</label>
              <div className='rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-cyan-300'>
                {schedule_status}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-white/10 p-4'>
          <h3 className='mb-3 text-sm font-semibold text-white'>Scope</h3>
          <div className='mb-3 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => set_scope_mode('products')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                scope_mode === 'products'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'bg-white/5 text-[#cbd5e1]'
              }`}
            >
              Entire products
            </button>
            <button
              type='button'
              onClick={() => set_scope_mode('variants')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                scope_mode === 'variants'
                  ? 'bg-fuchsia-500/20 text-fuchsia-200'
                  : 'bg-white/5 text-[#cbd5e1]'
              }`}
            >
              Specific variants
            </button>
          </div>

          {scope_mode === 'products' ? (
            <ProductPicker
              products={products}
              brands={brands}
              categories={categories}
              selected_ids={form.product_ids}
              on_toggle={id => on_bulk_select('product_ids', [id], true)}
              on_bulk_select={ids => on_bulk_select('product_ids', ids)}
              on_bulk_clear={ids => on_bulk_clear('product_ids', ids)}
            />
          ) : (
            <VariantPicker
              variants={variants}
              products={products}
              selected_ids={form.variant_ids}
              on_toggle={id => on_bulk_select('variant_ids', [id], true)}
              on_bulk_select={ids => on_bulk_select('variant_ids', ids)}
              on_bulk_clear={ids => on_bulk_clear('variant_ids', ids)}
            />
          )}
        </div>

        <div>
          <label className='admin-label'>Ngưỡng giá bán tối thiểu (VND)</label>
          <input
            type='number'
            min='0'
            value={form.min_final_price}
            onChange={event =>
              set_form(prev => ({ ...prev, min_final_price: event.target.value }))
            }
            className='admin-input w-full max-w-sm'
          />
        </div>

        {warnings.length > 0 && (
          <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200'>
            <ul className='space-y-1'>
              {warnings.map(item => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className='sticky bottom-2 z-20 flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-[#0c0c18]/95 p-3 backdrop-blur'>
          {editing_id ? (
            <button type='button' onClick={on_reset} className='admin-btn-ghost'>
              Hủy sửa
            </button>
          ) : null}
          <button
            type='button'
            onClick={on_preview}
            disabled={saving}
            className='admin-btn-ghost'
          >
            Xem preview
          </button>
          <button type='submit' disabled={saving} className='admin-btn-primary'>
            {saving ? 'Đang lưu...' : editing_id ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </section>
  )
}
