import AdminAutosizeTextarea from './AdminAutosizeTextarea.jsx'
import {
  format_price_display,
  normalize_price_input
} from '../../utils/priceInput.js'

/**
 * Bảng biến thể: combo tùy chọn, SKU, giá, tồn (ảnh theo giá trị trục đầu).
 */
export default function VariantTable({
  product_options,
  is_edit_mode,
  variants,
  onRowChange,
  onVariantOptionChange,
  onRemoveVariant
}) {
  if (!variants.length) {
    return (
      <div className='flex h-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-[#64748b]'>
        Thêm ít nhất một biến thể để tiếp tục
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-xl border border-white/10'>
      <table className='w-full text-sm'>
        <thead className='border-b border-white/10 bg-white/5'>
          <tr>
            {product_options.map((opt, oi) => (
              <th
                key={opt.option_id ?? `h-${oi}`}
                className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'
              >
                {opt.name?.trim() || `Tùy chọn ${oi + 1}`}
              </th>
            ))}
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              SKU
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Giá bán (₫) *
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Tồn
            </th>
            <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-white/5'>
          {variants.map((v, vi) => (
            <tr key={v.variant_id ?? `row-${vi}`} className='bg-white/[0.02] transition hover:bg-white/[0.05]'>
              {product_options.map((opt, oi) => {
                if (is_edit_mode) {
                  const current_id =
                    v.option_value_ids?.[oi] ??
                    ''
                  return (
                    <td key={`${vi}-${oi}`} className='px-4 py-3 align-top'>
                      <select
                        value={current_id === '' ? '' : String(current_id)}
                        onChange={e =>
                          onVariantOptionChange(vi, oi, e.target.value)
                        }
                        className='admin-select max-w-[12rem]'
                      >
                        <option value=''>—</option>
                        {opt.values.map(val => (
                          <option
                            key={val.option_value_id}
                            value={String(val.option_value_id)}
                          >
                            {val.value}
                          </option>
                        ))}
                      </select>
                    </td>
                  )
                }

                const sel = v.option_selections?.[oi] ?? 0
                const values = opt.values || []
                return (
                  <td key={`${vi}-${oi}`} className='px-4 py-3 align-top'>
                    <select
                      value={String(
                        sel >= 0 && sel < values.length ? sel : 0
                      )}
                      onChange={e =>
                        onVariantOptionChange(vi, oi, e.target.value)
                      }
                      className='admin-select max-w-[12rem]'
                    >
                      {values.map((val_item, val_i) => (
                        <option key={val_i} value={String(val_i)}>
                          {val_item.value ||
                            `(Trống ${val_i + 1})`}
                        </option>
                      ))}
                    </select>
                  </td>
                )
              })}
              <td className='px-4 py-3 align-top'>
                <AdminAutosizeTextarea
                  value={v.sku}
                  onChange={e => onRowChange(vi, 'sku', e.target.value)}
                  min_rows={1}
                  max_height_px={120}
                  placeholder='vd. SKU-01'
                  className='w-40 min-w-[10rem]'
                />
              </td>
              <td className='px-4 py-3 align-top'>
                <input
                  type='text'
                  inputMode='numeric'
                  value={format_price_display(v.price ?? '')}
                  onChange={e =>
                    onRowChange(
                      vi,
                      'price',
                      normalize_price_input(e.target.value)
                    )
                  }
                  placeholder='0'
                  className='admin-input w-28 min-w-[7rem]'
                />
              </td>
              <td className='px-4 py-3'>
                <input
                  type='number'
                  value={v.stock}
                  onChange={e => onRowChange(vi, 'stock', e.target.value)}
                  placeholder='0'
                  min='0'
                  className='admin-input w-20'
                />
              </td>
              <td className='px-4 py-3 text-right'>
                <button
                  type='button'
                  onClick={() => onRemoveVariant(vi)}
                  className='rounded-md border border-red-400/40 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10'
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
