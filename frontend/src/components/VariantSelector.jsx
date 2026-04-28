import { useMemo } from 'react'

export default function VariantSelector({
  variants,
  selected_variant,
  onVariantChange
}) {
  const selected_map = useMemo(() => {
    if (selected_variant?.color) {
      return { Color: selected_variant.color }
    }

    const next_map = {}
    ;(selected_variant?.attributes || []).forEach(item => {
      next_map[item.attribute] = item.value
    })
    return next_map
  }, [selected_variant])

  const variant_groups = useMemo(() => {
    const has_color_variants = variants.some(variant_item => variant_item.color)
    if (has_color_variants) {
      const color_values = []

      variants.forEach(variant_item => {
        const current_color = variant_item.color?.trim()
        if (!current_color) return

        const existing_item = color_values.find(
          value_item => value_item.value === current_color
        )

        if (!existing_item) {
          color_values.push({
            value: current_color,
            has_stock: variant_item.stock > 0
          })
          return
        }

        if (variant_item.stock > 0) {
          existing_item.has_stock = true
        }
      })

      return { Color: color_values }
    }

    const group_map = {}

    variants.forEach(variant_item => {
      variant_item.attributes.forEach(attribute_item => {
        if (!group_map[attribute_item.attribute]) {
          group_map[attribute_item.attribute] = []
        }

        const existing_item = group_map[attribute_item.attribute].find(
          value_item => value_item.value === attribute_item.value
        )

        if (!existing_item) {
          group_map[attribute_item.attribute].push({
            value: attribute_item.value,
            has_stock: variant_item.stock > 0
          })
          return
        }

        if (variant_item.stock > 0) {
          existing_item.has_stock = true
        }
      })
    })

    return group_map
  }, [variants])

  const pickVariantByValue = (attribute_name, value_name) => {
    if (attribute_name === 'Color') {
      const in_stock_variant = variants.find(
        variant_item =>
          variant_item.color === value_name &&
          variant_item.stock > 0
      )
      if (in_stock_variant) return in_stock_variant

      return variants.find(variant_item => variant_item.color === value_name)
    }

    const candidate_map = {
      ...selected_map,
      [attribute_name]: value_name
    }

    const best_variant = variants.find(variant_item => {
      const variant_map = {}
      variant_item.attributes.forEach(item => {
        variant_map[item.attribute] = item.value
      })

      const is_match = Object.entries(candidate_map).every(
        ([key_name, key_value]) => variant_map[key_name] === key_value
      )

      return is_match && variant_item.stock > 0
    })

    if (best_variant) return best_variant

    return variants.find(variant_item =>
      variant_item.attributes.some(
        item =>
          item.attribute === attribute_name &&
          item.value === value_name
      )
    )
  }

  return (
    <section className='space-y-5'>
      <h3 className='font-display text-sm font-semibold uppercase tracking-wider text-white'>
        Variant options
      </h3>

      <div className='space-y-4'>
        {Object.entries(variant_groups).map(([attribute_name, values]) => (
          <div key={attribute_name} className='space-y-2'>
            <p className='flex items-center text-xs font-display uppercase tracking-wider text-[#94a3b8]'>
              {attribute_name}
              {attribute_name === 'Color' && selected_map[attribute_name] && (
                <span className='ml-2 text-[#f8fafc]'>{selected_map[attribute_name]}</span>
              )}
            </p>

            <div className='flex flex-wrap gap-2'>
              {values.map(value_item => {
                const is_selected = selected_map[attribute_name] === value_item.value
                const matched_variant = pickVariantByValue(
                  attribute_name,
                  value_item.value
                )

                if (attribute_name === 'Color' && matched_variant?.images?.[0]) {
                  return (
                    <button
                      key={`${attribute_name}-${value_item.value}`}
                      type='button'
                      disabled={!matched_variant || matched_variant.stock <= 0}
                      onClick={() => matched_variant && onVariantChange(matched_variant)}
                      className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border transition ${
                        is_selected
                          ? 'border-[#9f67ff] shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                          : 'border-white/10 hover:border-cyan-400/60'
                      } ${
                        !matched_variant || matched_variant.stock <= 0
                          ? 'cursor-not-allowed opacity-45'
                          : 'cursor-pointer'
                      }`}
                      title={value_item.value}
                    >
                      <img
                        src={matched_variant.images[0].image_url}
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
                    disabled={!matched_variant || matched_variant.stock <= 0}
                    onClick={() => matched_variant && onVariantChange(matched_variant)}
                    className={`rounded-lg border px-3 py-2 text-xs font-display uppercase tracking-wide transition ${
                      is_selected
                        ? 'border-[#9f67ff] bg-[#7c3aed]/20 text-white'
                        : 'border-white/15 bg-white/5 text-[#cbd5e1] hover:border-cyan-400/60'
                    } ${!matched_variant || matched_variant.stock <= 0 ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
                  >
                    {value_item.value}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
