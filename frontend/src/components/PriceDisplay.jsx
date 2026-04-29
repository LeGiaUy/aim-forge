import { formatVnd } from '../utils/currency.js'

export default function PriceDisplay({ price_value, selected_variant }) {
  const current_price = price_value

  return (
    <div className='flex items-end gap-3'>
      <p className='font-display text-3xl font-bold text-[#9f67ff] glow-purple'>
        {formatVnd(current_price)}
      </p>
      {selected_variant?.stock === 0 && (
        <span className='mb-1 rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-wider text-red-300'>
          Out of stock
        </span>
      )}
    </div>
  )
}
