const stat_card_base =
  'rounded-xl border border-white/10 bg-white/[0.03] p-3'

export default function DiscountPreview({ preview }) {
  if (!preview) return null

  return (
    <section className='admin-card space-y-3'>
      <h2 className='admin-section-title'>Preview tác động</h2>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <div className={stat_card_base}>
          <p className='text-xs text-[#94a3b8]'>Affected SKU</p>
          <p className='text-xl font-semibold text-white'>{preview.affected_sku_count}</p>
        </div>
        <div className={stat_card_base}>
          <p className='text-xs text-[#94a3b8]'>Avg discount</p>
          <p className='text-xl font-semibold text-cyan-300'>
            {preview.avg_discount_percent}%
          </p>
        </div>
        <div className={stat_card_base}>
          <p className='text-xs text-[#94a3b8]'>Invalid price</p>
          <p className='text-xl font-semibold text-amber-300'>
            {preview.invalid_zero_or_negative_count}
          </p>
        </div>
        <div className={stat_card_base}>
          <p className='text-xs text-[#94a3b8]'>Below cost</p>
          <p className='text-xl font-semibold text-rose-300'>
            {preview.invalid_below_cost_count}
          </p>
        </div>
      </div>

      <div className='overflow-x-auto rounded-xl border border-white/10'>
        <table className='w-full text-xs'>
          <thead className='bg-white/5 text-[#94a3b8]'>
            <tr>
              <th className='px-3 py-2 text-left'>Product</th>
              <th className='px-3 py-2 text-left'>SKU</th>
              <th className='px-3 py-2 text-right'>Original</th>
              <th className='px-3 py-2 text-right'>Final</th>
              <th className='px-3 py-2 text-right'>Discount %</th>
            </tr>
          </thead>
          <tbody>
            {(preview.samples || []).map(row => {
              const invalid = row.below_cost || row.below_zero
              return (
                <tr
                  key={row.variant_id}
                  className={invalid ? 'bg-rose-500/10' : 'border-t border-white/5'}
                >
                  <td className='px-3 py-2 text-white'>{row.product_name}</td>
                  <td className='px-3 py-2 text-[#cbd5e1]'>{row.sku || `#${row.variant_id}`}</td>
                  <td className='px-3 py-2 text-right text-[#94a3b8]'>{row.base_price}</td>
                  <td className='px-3 py-2 text-right text-cyan-300'>{row.final_price}</td>
                  <td className='px-3 py-2 text-right text-[#94a3b8]'>
                    {row.discount_percent}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
