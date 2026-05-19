import { useMemo, useState } from 'react'

export default function SelectedTargetsPanel({
  products,
  variants,
  selected_product_ids,
  selected_variant_ids,
  on_remove_product,
  on_remove_variant
}) {
  const [open_product_ids, set_open_product_ids] = useState({})

  const grouped = useMemo(() => {
    const by_product = {}
    for (const variant of variants) {
      if (!selected_variant_ids.includes(variant.variant_id)) continue
      const pid = variant.product_id
      if (!by_product[pid]) {
        by_product[pid] = {
          product_id: pid,
          product_name: variant.product_name,
          variants: []
        }
      }
      by_product[pid].variants.push(variant)
    }
    return Object.values(by_product)
  }, [variants, selected_variant_ids])

  return (
    <aside className='rounded-xl border border-white/10 bg-[#0c0c18] p-3'>
      <h3 className='mb-2 text-sm font-semibold text-white'>Các mục đã chọn</h3>
      <div className='space-y-2 text-xs'>
        <p className='text-[#94a3b8]'>
          Sản phẩm: {selected_product_ids.length} • Biến thể: {selected_variant_ids.length}
        </p>

        {selected_product_ids.length > 0 && (
          <div>
            <p className='mb-1 text-[#cbd5e1]'>Products</p>
            <div className='flex flex-wrap gap-1'>
              {selected_product_ids.map(id => {
                const row = products.find(item => item.product_id === id)
                return (
                  <button
                    key={id}
                    type='button'
                    onClick={() => on_remove_product(id)}
                    className='rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-200'
                  >
                    {row?.name || `#${id}`} ×
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {grouped.length > 0 && (
          <div>
            <p className='mb-1 text-[#cbd5e1]'>Variants</p>
            <div className='space-y-1'>
              {grouped.map(group => (
                <div key={group.product_id} className='rounded-md border border-white/10'>
                  <button
                    type='button'
                    className='flex w-full items-center justify-between px-2 py-1 text-left text-[#cbd5e1]'
                    onClick={() =>
                      set_open_product_ids(prev => ({
                        ...prev,
                        [group.product_id]: !prev[group.product_id]
                      }))
                    }
                  >
                    <span>{group.product_name}</span>
                    <span>{group.variants.length}</span>
                  </button>
                  {open_product_ids[group.product_id] && (
                    <div className='space-y-1 border-t border-white/10 p-2'>
                      {group.variants.map(variant => (
                        <button
                          key={variant.variant_id}
                          type='button'
                          className='block w-full rounded border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-left text-fuchsia-200'
                          onClick={() => on_remove_variant(variant.variant_id)}
                        >
                          {variant.sku || `#${variant.variant_id}`} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
