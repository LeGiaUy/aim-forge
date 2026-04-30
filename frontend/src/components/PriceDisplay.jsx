import { formatVnd } from '../utils/currency.js'

export default function PriceDisplay({ selected_variant, product_data }) {
  const original = product_data?.price
  const final =
    selected_variant?.final_price ?? product_data?.final_price ?? original
  const discount_amount = product_data?.discount_amount
  const has_discount =
    discount_amount != null &&
    discount_amount > 0 &&
    final != null &&
    original != null &&
    final < original

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-end gap-3'>
        {has_discount ? (
          <>
            <p className='font-display text-lg font-semibold text-[#64748b] line-through'>
              {formatVnd(original)}
            </p>
            <p className='font-display text-3xl font-bold text-[#06b6d4] glow-purple'>
              {formatVnd(final)}
            </p>
          </>
        ) : (
          <p className='font-display text-3xl font-bold text-[#9f67ff] glow-purple'>
            {formatVnd(final)}
          </p>
        )}
        {selected_variant?.stock === 0 && (
          <span className='mb-1 rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-wider text-red-300'>
            Out of stock
          </span>
        )}
      </div>
      {has_discount && (
        <p className='text-sm font-semibold text-emerald-400'>
          Tiết kiệm {formatVnd(Math.round(discount_amount))}
        </p>
      )}
    </div>
  )
}
