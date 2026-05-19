import { Fragment, useMemo, useState } from 'react'

const to_local = value => {
  if (!value) return '—'
  const date_obj = new Date(value)
  if (!Number.isFinite(date_obj.getTime())) return '—'
  return date_obj.toLocaleString('vi-VN')
}

const get_countdown = item => {
  const now = Date.now()
  const start_ts = new Date(item.start_at).getTime()
  const end_ts = item.end_at ? new Date(item.end_at).getTime() : null
  if (item.status === 'upcoming') {
    const hours = Math.max(0, Math.floor((start_ts - now) / (1000 * 60 * 60)))
    return `Bắt đầu sau ${hours}h`
  }
  if (item.status === 'active' && end_ts != null) {
    const hours = Math.max(0, Math.floor((end_ts - now) / (1000 * 60 * 60)))
    return `Kết thúc sau ${hours}h`
  }
  return '—'
}

const status_color = {
  active: 'bg-emerald-500/20 text-emerald-300',
  upcoming: 'bg-cyan-500/20 text-cyan-300',
  expired: 'bg-amber-500/20 text-amber-300',
  inactive: 'bg-slate-500/20 text-slate-300'
}

export default function DiscountTable({
  loading,
  discount_list,
  on_edit,
  on_delete
}) {
  const [expanded_id_map, set_expanded_id_map] = useState({})
  const rows = useMemo(() => discount_list || [], [discount_list])

  return (
    <section className='overflow-hidden rounded-xl border border-white/10 bg-[#0c0c18]'>
      <table className='w-full text-sm'>
        <thead className='border-b border-white/10 bg-white/5'>
          <tr>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Chiến dịch
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Giá trị
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Phạm vi
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Trạng thái
            </th>
            <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-white/5'>
          {loading ? (
            <tr>
              <td colSpan={5} className='px-4 py-12 text-center text-[#64748b]'>
                Đang tải...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className='px-4 py-12 text-center text-[#64748b]'>
                Chưa có chiến dịch khuyến mãi
              </td>
            </tr>
          ) : (
            rows.map(item => (
              <Fragment key={item.discount_id}>
                <tr className='transition hover:bg-white/[0.03]'>
                  <td className='px-4 py-3 text-white'>
                    <p className='font-medium'>{item.name}</p>
                    <p className='text-xs text-[#64748b]'>
                      {to_local(item.start_at)} - {item.end_at ? to_local(item.end_at) : 'Không giới hạn'}
                    </p>
                    <p className='text-xs text-[#64748b]'>{get_countdown(item)}</p>
                  </td>
                  <td className='px-4 py-3 text-cyan-300'>
                    {item.type === 'PERCENT' ? `${item.value}%` : `${item.value} VND`}
                  </td>
                  <td className='px-4 py-3 text-[#cbd5e1]'>
                    {item.scope} • {(item.products?.length || 0) + (item.variants?.length || 0)} mục
                  </td>
                  <td className='px-4 py-3'>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${status_color[item.status] || status_color.inactive}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex justify-end gap-2'>
                      <button
                        type='button'
                        onClick={() =>
                          set_expanded_id_map(prev => ({
                            ...prev,
                            [item.discount_id]: !prev[item.discount_id]
                          }))
                        }
                        className='admin-btn-ghost !px-2 !py-1 text-xs'
                      >
                        {expanded_id_map[item.discount_id] ? 'Ẩn' : 'Chi tiết'}
                      </button>
                      <button
                        type='button'
                        onClick={() => on_edit(item)}
                        className='admin-btn-ghost !px-2 !py-1 text-xs'
                      >
                        Sửa
                      </button>
                      <button
                        type='button'
                        onClick={() => on_delete(item.discount_id)}
                        className='rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10'
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded_id_map[item.discount_id] && (
                  <tr>
                    <td colSpan={5} className='bg-white/[0.02] px-4 py-3'>
                      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                        <div>
                          <p className='mb-1 text-xs font-semibold text-[#94a3b8]'>Sản phẩm</p>
                          <div className='flex flex-wrap gap-1'>
                            {(item.products || []).map(p => (
                              <span key={p.product_id} className='rounded bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-200'>
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className='mb-1 text-xs font-semibold text-[#94a3b8]'>Biến thể</p>
                          <div className='flex flex-wrap gap-1'>
                            {(item.variants || []).map(v => (
                              <span key={v.variant_id} className='rounded bg-fuchsia-500/15 px-2 py-0.5 text-xs text-fuchsia-200'>
                                {v.product_name} - {v.sku || `#${v.variant_id}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}
