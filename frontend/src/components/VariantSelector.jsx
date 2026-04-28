import { useMemo } from 'react'

export default function VariantSelector({
  variants,
  selected_variant,
  onVariantChange
}) {
  const selected_map = useMemo(() => {
    const next_map = {}
    ;(selected_variant?.attributes || []).forEach(item => {
      next_map[item.attribute] = item.value
    })
    return next_map
  }, [selected_variant])

  const variant_groups = useMemo(() => {
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
            <p className='text-xs font-display uppercase tracking-wider text-[#94a3b8]'>
              {attribute_name}
            </p>

            <div className='flex flex-wrap gap-2'>
              {values.map(value_item => {
                const is_selected = selected_map[attribute_name] === value_item.value
                const matched_variant = pickVariantByValue(
                  attribute_name,
                  value_item.value
                )

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
