import { useCallback, useMemo } from 'react'

const build_variant_lookup = variant_item => {
  const map = {}
  ;(variant_item.attributes || []).forEach(item => {
    map[item.attribute] = item.value
  })
  return map
}

const matches_partial_map = (variant_item, partial_map) => {
  const vm = build_variant_lookup(variant_item)
  return Object.entries(partial_map).every(
    ([key_name, key_value]) => vm[key_name] === key_value
  )
}

const find_variant_for_partial = (variant_list, partial_map) => {
  const in_stock = variant_list.find(
    v => matches_partial_map(v, partial_map) && v.stock > 0
  )
  if (in_stock) return in_stock
  return variant_list.find(v => matches_partial_map(v, partial_map))
}

/**
 * Chọn biến thể theo product_options (thứ tự trục) hoặc gom từ attributes.
 */
export default function VariantSelector({
  product_options = [],
  variants,
  selected_variant,
  onVariantChange
}) {
  const selected_map = useMemo(() => {
    const next = {}
    ;(selected_variant?.attributes || []).forEach(item => {
      next[item.attribute] = item.value
    })
    return next
  }, [selected_variant])

  const variant_groups = useMemo(() => {
    if (!variants?.length) return {}

    const axis_list = product_options.length
      ? product_options.map(o => o.name).filter(Boolean)
      : [
          ...new Set(
            variants.flatMap(v =>
              (v.attributes || []).map(a => a.attribute)
            )
          )
        ]

    const group_map = {}
    axis_list.forEach(axis => {
      group_map[axis] = []
    })

    variants.forEach(variant_item => {
      const vm = build_variant_lookup(variant_item)
      axis_list.forEach(axis => {
        const val = vm[axis]
        if (!val || !String(val).trim()) return
        const list = group_map[axis]
        const existing = list.find(x => x.value === val)
        if (!existing) {
          list.push({ value: val, has_stock: variant_item.stock > 0 })
        } else if (variant_item.stock > 0) {
          existing.has_stock = true
        }
      })
    })

    return group_map
  }, [variants, product_options])

  const ordered_axes = useMemo(() => {
    if (product_options.length) {
      return product_options.map(o => o.name).filter(Boolean)
    }
    return Object.keys(variant_groups)
  }, [product_options, variant_groups])

  const pick_variant_by_value = useCallback(
    (attribute_name, value_name) => {
      const partial = { ...selected_map, [attribute_name]: value_name }
      return find_variant_for_partial(variants, partial)
    },
    [variants, selected_map]
  )

  const thumbnail_axis = useMemo(() => {
    for (const axis of ordered_axes) {
      for (const value_item of variant_groups[axis] || []) {
        const mv = find_variant_for_partial(variants, {
          ...selected_map,
          [axis]: value_item.value
        })
        const url = mv?.images?.[0]?.image_url
        if (url) return axis
      }
    }
    return null
  }, [ordered_axes, variant_groups, variants, selected_map])

  if (!variants?.length) return null

  const has_groups = ordered_axes.some(
    axis => (variant_groups[axis] || []).length > 0
  )
  if (!has_groups) return null

  return (
    <section className='space-y-5'>
      <h3 className='font-display text-sm font-semibold uppercase tracking-wider text-white'>
        Tùy chọn phân loại
      </h3>

      <div className='space-y-4'>
        {ordered_axes.map(attribute_name => {
          const values = variant_groups[attribute_name] || []
          if (!values.length) return null

          const show_thumbs = thumbnail_axis === attribute_name

          return (
            <div key={attribute_name} className='space-y-2'>
              <p className='flex items-center text-xs font-display uppercase tracking-wider text-[#94a3b8]'>
                {attribute_name}
                {selected_map[attribute_name] ? (
                  <span className='ml-2 text-[#f8fafc]'>
                    {selected_map[attribute_name]}
                  </span>
                ) : null}
              </p>

              <div className='flex flex-wrap gap-2'>
                {values.map(value_item => {
                  const is_selected =
                    selected_map[attribute_name] === value_item.value
                  const matched = pick_variant_by_value(
                    attribute_name,
                    value_item.value
                  )
                  const img_url = matched?.images?.[0]?.image_url
                  const out = !matched || matched.stock <= 0

                  if (show_thumbs && img_url) {
                    return (
                      <button
                        key={`${attribute_name}-${value_item.value}`}
                        type='button'
                        disabled={out}
                        onClick={() => matched && onVariantChange(matched)}
                        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border transition ${
                          is_selected
                            ? 'border-[#9f67ff] shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                            : 'border-white/10 hover:border-cyan-400/60'
                        } ${
                          out
                            ? 'cursor-not-allowed opacity-45'
                            : 'cursor-pointer'
                        }`}
                        title={value_item.value}
                      >
                        <img
                          src={img_url}
                          alt={value_item.value}
                          loading='lazy'
                          className='h-full w-full object-cover'
                        />
                      </button>
                    )
                  }

                  return (
                    <button
                      key={`${attribute_name}-${value_item.value}`}
                      type='button'
                      disabled={out}
                      onClick={() => matched && onVariantChange(matched)}
                      className={`rounded-lg border px-3 py-2 text-xs font-display uppercase tracking-wide transition ${
                        is_selected
                          ? 'border-[#9f67ff] bg-[#7c3aed]/20 text-white'
                          : 'border-white/15 bg-white/5 text-[#cbd5e1] hover:border-cyan-400/60'
                      } ${out ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
                    >
                      {value_item.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
