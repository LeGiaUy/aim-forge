import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { orderApi, paymentApi } from '../services/api.js'
import { formatVnd } from '../utils/currency.js'
import { useState } from 'react'

function CartItemRow({
  item_data,
  on_increase,
  on_decrease,
  on_remove,
  disable_action
}) {
  return (
    <li className='rounded-xl border border-white/10 bg-white/5 p-4'>
      <article className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <img
            src={item_data.image || 'https://placehold.co/96x96?text=No+Image'}
            alt={item_data.product_name}
            className='h-16 w-16 rounded-lg object-cover'
          />
          <div className='space-y-1'>
            <h2 className='font-display text-sm font-semibold uppercase tracking-wider text-white'>
              {item_data.product_name}
            </h2>
            <p className='text-xs text-[#94a3b8]'>{item_data.sku}</p>
            {(item_data.variant_name || '').trim() ? (
              <p className='max-w-[40ch] text-xs text-[#a5b4fc] line-clamp-2'>
                {item_data.variant_name}
              </p>
            ) : null}
            <p className='text-xs text-[#64748b]'>
              {item_data.brand || 'Không có thương hiệu'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <p className='text-sm font-semibold text-[#cbd5e1]'>
            {formatVnd(item_data.price)}
          </p>
          <div className='flex items-center rounded-lg border border-white/15 bg-white/5'>
            <button
              type='button'
              onClick={on_decrease}
              disabled={disable_action}
              className='h-9 w-9 text-[#cbd5e1] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#64748b]'
            >
              -
            </button>
            <span className='w-8 text-center text-sm text-white'>
              {item_data.quantity}
            </span>
            <button
              type='button'
              onClick={on_increase}
              disabled={disable_action}
              className='h-9 w-9 text-[#cbd5e1] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#64748b]'
            >
              +
            </button>
          </div>
          <p className='w-20 text-right text-sm font-semibold text-[#e2e8f0]'>
            {formatVnd(item_data.subtotal)}
          </p>
          <button
            type='button'
            onClick={on_remove}
            disabled={disable_action}
            className='rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Xóa
          </button>
        </div>
      </article>
    </li>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const {
    cart_data,
    cart_loading,
    updateCartItem,
    removeCartItem,
    clearCart
  } = useCart()
  const [address_text, setAddressText] = useState('')
  const [payment_method, setPaymentMethod] = useState('VNPAY')
  const [submit_loading, setSubmitLoading] = useState(false)
  const [error_message, setErrorMessage] = useState('')

  const handleIncrease = async item_data => {
    await updateCartItem({
      variant_id: item_data.variant_id,
      quantity: item_data.quantity + 1
    })
  }

  const handleDecrease = async item_data => {
    if (item_data.quantity <= 1) {
      await removeCartItem(item_data.variant_id)
      return
    }

    await updateCartItem({
      variant_id: item_data.variant_id,
      quantity: item_data.quantity - 1
    })
  }

  const handleRemove = async item_data => {
    await removeCartItem(item_data.variant_id)
  }

  const handleCheckout = async () => {
    if (!address_text.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ nhận hàng')
      return
    }

    setErrorMessage('')
    setSubmitLoading(true)

    try {
      const order_response = await orderApi.createOrder({
        address: address_text.trim()
      })
      const order_data = order_response.data?.data

      if (!order_data?.order_id) {
        throw new Error('Không thể tạo đơn hàng')
      }

      if (payment_method === 'COD') {
        await paymentApi.createCod({
          orderId: order_data.order_id
        })
        clearCart()
        navigate(
          `/payment-return?method=COD&status=success&order_id=${order_data.order_id}`
        )
        return
      }

      const payment_response = await paymentApi.createVnpay({
        orderId: order_data.order_id
      })
      const payment_url = payment_response.data?.data?.payment_url

      if (!payment_url) {
        throw new Error('Không thể tạo liên kết VNPAY')
      }

      window.location.href = payment_url
    } catch (error) {
      setErrorMessage(error.message || 'Thanh toán thất bại')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8'>
      <header className='mb-6 flex items-center justify-between'>
        <h1 className='font-display text-xl font-bold uppercase tracking-wider text-white sm:text-2xl'>
          Giỏ hàng
        </h1>
        <Link
          to='/'
          className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8] transition hover:text-[#9f67ff]'
        >
          Tiếp tục mua sắm
        </Link>
      </header>

      {cart_data.items.length === 0 && !cart_loading && (
        <section className='rounded-2xl border border-white/10 bg-white/5 p-10 text-center'>
          <p className='text-sm text-[#94a3b8]'>Giỏ hàng của bạn đang trống</p>
        </section>
      )}

      {cart_data.items.length > 0 && (
        <section className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]'>
          <ul className='space-y-3'>
            {cart_data.items.map(item_data => (
              <CartItemRow
                key={item_data.variant_id}
                item_data={item_data}
                on_increase={() => handleIncrease(item_data)}
                on_decrease={() => handleDecrease(item_data)}
                on_remove={() => handleRemove(item_data)}
                disable_action={cart_loading}
              />
            ))}
          </ul>

          <aside className='h-fit rounded-2xl border border-white/10 bg-white/5 p-5'>
            <h2 className='font-display text-sm font-semibold uppercase tracking-wider text-[#cbd5e1]'>
              Tóm tắt đơn hàng
            </h2>
            <div className='mt-4 flex items-center justify-between text-sm text-[#94a3b8]'>
              <span>Sản phẩm</span>
              <span>{cart_data.items.length}</span>
            </div>
            <div className='mt-2 flex items-center justify-between font-display text-lg font-bold text-white'>
              <span>Tổng cộng</span>
              <span>{formatVnd(cart_data.total)}</span>
            </div>
            <label className='mt-4 block'>
              <span className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Địa chỉ nhận hàng
              </span>
              <textarea
                value={address_text}
                onChange={event => setAddressText(event.target.value)}
                rows={3}
                placeholder='Nhập địa chỉ của bạn'
                className='mt-2 w-full rounded-xl border border-white/15 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none ring-[#7c3aed] transition placeholder:text-[#64748b] focus:ring-2'
              />
            </label>
            <fieldset className='mt-4'>
              <legend className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Phương thức thanh toán
              </legend>
              <div className='mt-2 space-y-2'>
                <label className='flex cursor-pointer items-center gap-2 text-sm text-[#cbd5e1]'>
                  <input
                    type='radio'
                    name='payment_method'
                    value='VNPAY'
                    checked={payment_method === 'VNPAY'}
                    onChange={event => setPaymentMethod(event.target.value)}
                  />
                  <span>VNPAY</span>
                </label>
                <label className='flex cursor-pointer items-center gap-2 text-sm text-[#cbd5e1]'>
                  <input
                    type='radio'
                    name='payment_method'
                    value='COD'
                    checked={payment_method === 'COD'}
                    onChange={event => setPaymentMethod(event.target.value)}
                  />
                  <span>Thanh toán khi nhận hàng</span>
                </label>
              </div>
            </fieldset>
            {error_message && (
              <p className='mt-3 text-xs font-semibold text-red-300'>
                {error_message}
              </p>
            )}
            <button
              type='button'
              onClick={handleCheckout}
              disabled={cart_loading || submit_loading}
              className='mt-4 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110'
            >
              {submit_loading ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </aside>
        </section>
      )}
    </main>
  )
}
