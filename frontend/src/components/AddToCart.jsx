import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'

const PlusIcon = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.2'
    aria-hidden='true'
  >
    <path d='M12 5v14M5 12h14' />
  </svg>
)

const MinusIcon = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.2'
    aria-hidden='true'
  >
    <path d='M5 12h14' />
  </svg>
)

const getStockState = stock_value => {
  if (!stock_value || stock_value <= 0) {
    return {
      label: 'Hết hàng',
      class_name:
        'border-red-400/30 bg-red-500/10 text-red-300'
    }
  }

  if (stock_value < 5) {
    return {
      label: `Sắp hết hàng (còn ${stock_value})`,
      class_name:
        'border-amber-400/30 bg-amber-500/10 text-amber-300'
    }
  }

  return {
    label: `Còn hàng (${stock_value})`,
    class_name:
      'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
  }
}

export default function AddToCart({ selected_variant }) {
  const { addToCart, cart_data } = useCart()
  const [quantity_value, setQuantityValue] = useState(1)
  const [toast_state, setToastState] = useState({
    message: '',
    type: ''
  })
  const [loading_state, setLoadingState] = useState(false)

  const stock_value = selected_variant?.stock || 0

  const cart_quantity = useMemo(() => {
    const cart_item = cart_data.items.find(
      item_value =>
        item_value.variant_id === selected_variant?.variant_id
    )
    return cart_item?.quantity || 0
  }, [cart_data.items, selected_variant?.variant_id])

  const available_quantity = useMemo(() => {
    return Math.max(stock_value - cart_quantity, 0)
  }, [stock_value, cart_quantity])

  const stock_state = useMemo(() => {
    return getStockState(selected_variant?.stock || 0)
  }, [selected_variant])

  const disable_add_button =
    !selected_variant ||
    stock_value <= 0 ||
    available_quantity <= 0

  useEffect(() => {
    setQuantityValue(1)
  }, [selected_variant?.variant_id])

  useEffect(() => {
    if (available_quantity <= 0) return
    setQuantityValue(prev_value =>
      Math.min(Math.max(prev_value, 1), available_quantity)
    )
  }, [available_quantity])

  const showToast = (message_value, type_value) => {
    setToastState({ message: message_value, type: type_value })
    window.setTimeout(() => {
      setToastState({ message: '', type: '' })
    }, 2400)
  }

  const updateQuantity = next_value => {
    if (!selected_variant || available_quantity <= 0) return
    const clamped_value = Math.min(
      Math.max(next_value, 1),
      available_quantity
    )
    setQuantityValue(clamped_value)
  }

  const handleQuantityInput = event => {
    const raw_value = event.target.value
    if (raw_value === '') return
    const parsed_value = Number.parseInt(raw_value, 10)
    if (Number.isNaN(parsed_value)) return
    setQuantityValue(parsed_value)
  }

  const commitQuantityInput = () => {
    updateQuantity(quantity_value)
  }

  const handleAddToCart = async () => {
    if (disable_add_button || loading_state) return

    const final_quantity = Math.min(
      Math.max(quantity_value, 1),
      available_quantity
    )

    setQuantityValue(final_quantity)

    setLoadingState(true)
    try {
      await addToCart({
        variant_id: selected_variant.variant_id,
        quantity: final_quantity
      })
      showToast('Đã thêm vào giỏ hàng', 'success')
    } catch (error) {
      showToast(error.message || 'Thêm vào giỏ thất bại', 'error')
    } finally {
      setLoadingState(false)
    }
  }

  return (
    <section className='space-y-4 rounded-2xl border border-white/10 bg-[#090912]/70 p-5'>
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-wider ${stock_state.class_name}`}
      >
        {stock_state.label}
      </div>

      <div className='flex items-center gap-3'>
        <p className='text-xs font-display uppercase tracking-wider text-[#94a3b8]'>
          Số lượng
        </p>

        <div className='flex items-center rounded-lg border border-white/15 bg-white/5'>
          <button
            type='button'
            aria-label='Giảm số lượng'
            onClick={() => updateQuantity(quantity_value - 1)}
            className='flex h-10 w-10 items-center justify-center text-[#cbd5e1] transition hover:text-white'
          >
            <MinusIcon />
          </button>
          <input
            type='number'
            min={1}
            max={available_quantity || 1}
            inputMode='numeric'
            aria-label='Số lượng muốn mua'
            value={quantity_value}
            disabled={disable_add_button}
            onChange={handleQuantityInput}
            onBlur={commitQuantityInput}
            className='h-10 w-14 border-x border-white/15 bg-transparent text-center font-display text-sm font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed disabled:text-[#64748b]'
          />
          <button
            type='button'
            aria-label='Tăng số lượng'
            onClick={() => updateQuantity(quantity_value + 1)}
            disabled={
              disable_add_button ||
              quantity_value >= available_quantity
            }
            className='flex h-10 w-10 items-center justify-center text-[#cbd5e1] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#64748b]'
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {cart_quantity > 0 && available_quantity > 0 && (
        <p className='text-xs text-[#94a3b8]'>
          Đã có {cart_quantity} trong giỏ — còn thêm được tối đa{' '}
          {available_quantity}
        </p>
      )}

      {cart_quantity > 0 && available_quantity <= 0 && stock_value > 0 && (
        <p className='text-xs font-semibold text-amber-300'>
          Đã đạt số lượng tối đa trong giỏ hàng
        </p>
      )}

      <button
        type='button'
        disabled={disable_add_button || loading_state}
        onClick={handleAddToCart}
        className={`w-full rounded-xl px-4 py-3 text-sm font-display font-semibold uppercase tracking-wider transition ${
          disable_add_button
            ? 'cursor-not-allowed border border-white/15 bg-white/5 text-[#64748b]'
            : 'cursor-pointer bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-[0_0_24px_rgba(124,58,237,0.45)] hover:brightness-110'
        }`}
      >
        {loading_state ? 'Đang thêm...' : 'Thêm vào giỏ'}
      </button>

      {toast_state.message && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
            toast_state.type === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-400/30 bg-red-500/10 text-red-300'
          }`}
        >
          {toast_state.message}
        </div>
      )}
    </section>
  )
}
