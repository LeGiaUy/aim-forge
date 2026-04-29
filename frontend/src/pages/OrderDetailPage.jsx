import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { orderApi, paymentApi } from '../services/api.js'
import { formatVnd } from '../utils/currency.js'

const ORDER_STATUS_CLASS = {
  PENDING: 'text-amber-300 border-amber-300/30 bg-amber-500/10',
  PAID: 'text-emerald-300 border-emerald-300/30 bg-emerald-500/10',
  FAILED: 'text-red-300 border-red-300/30 bg-red-500/10',
  CANCELLED: 'text-zinc-300 border-zinc-300/30 bg-zinc-500/10',
  COMPLETED: 'text-sky-300 border-sky-300/30 bg-sky-500/10'
}

const PAYMENT_STATUS_CLASS = {
  PENDING: 'text-amber-300 border-amber-300/30 bg-amber-500/10',
  SUCCESS: 'text-emerald-300 border-emerald-300/30 bg-emerald-500/10',
  FAILED: 'text-red-300 border-red-300/30 bg-red-500/10'
}

function StatusBadge({ label_text, status_value, type_value }) {
  const class_name =
    type_value === 'payment'
      ? PAYMENT_STATUS_CLASS[status_value] ||
        'text-zinc-300 border-zinc-300/30 bg-zinc-500/10'
      : ORDER_STATUS_CLASS[status_value] ||
        'text-zinc-300 border-zinc-300/30 bg-zinc-500/10'

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${class_name}`}
    >
      {label_text}: {status_value}
    </span>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order_data, setOrderData] = useState(null)
  const [is_loading_data, setIsLoadingData] = useState(false)
  const [error_text, setErrorText] = useState('')
  const [is_retry_loading, setIsRetryLoading] = useState(false)

  useEffect(() => {
    const fetchOrderDetail = async () => {
      setIsLoadingData(true)
      setErrorText('')

      try {
        const response = await orderApi.getOrderById(id)
        setOrderData(response.data?.data || null)
      } catch (error) {
        setErrorText(error.message || 'Cannot load order detail')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchOrderDetail()
  }, [id])

  const handleRetryVnpay = async () => {
    if (!order_data) {
      return
    }

    setErrorText('')
    setIsRetryLoading(true)

    try {
      const response = await paymentApi.createVnpay({
        orderId: order_data.order_id
      })
      const payment_url = response.data?.data?.payment_url

      if (!payment_url) {
        throw new Error('Cannot create VNPAY url')
      }

      window.location.href = payment_url
    } catch (error) {
      setErrorText(error.message || 'Cannot retry VNPAY payment')
    } finally {
      setIsRetryLoading(false)
    }
  }

  const first_payment = order_data?.payments?.[0]
  const can_retry_vnpay =
    order_data &&
    order_data.status !== 'PAID' &&
    first_payment?.method === 'VNPAY' &&
    first_payment?.status !== 'SUCCESS'

  return (
    <main className='mx-auto min-h-screen max-w-5xl px-6 pb-12 pt-28'>
      <div className='mb-4'>
        <Link
          to='/profile'
          className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8] transition hover:text-[#c4b5fd]'
        >
          Back to profile
        </Link>
      </div>

      {is_loading_data && (
        <section className='rounded-2xl border border-white/10 bg-white/5 p-6'>
          <p className='text-sm text-[#94a3b8]'>Loading order detail...</p>
        </section>
      )}

      {!is_loading_data && error_text && (
        <section className='rounded-2xl border border-red-400/30 bg-red-500/10 p-6'>
          <p className='text-sm font-semibold text-red-300'>{error_text}</p>
        </section>
      )}

      {!is_loading_data && !error_text && order_data && (
        <>
          <section className='rounded-2xl border border-white/10 bg-white/5 p-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <h1 className='font-display text-xl font-bold uppercase tracking-wider text-white'>
                  Order #{order_data.order_id}
                </h1>
                <p className='mt-1 text-xs text-[#94a3b8]'>
                  {new Date(order_data.created_at).toLocaleString('vi-VN')}
                </p>
                <p className='mt-2 text-sm text-[#cbd5e1]'>{order_data.address}</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <StatusBadge label_text='Order' status_value={order_data.status} />
                <StatusBadge
                  label_text='Payment'
                  status_value={order_data.payments[0]?.status || 'PENDING'}
                  type_value='payment'
                />
              </div>
            </div>
            {can_retry_vnpay && (
              <div className='mt-4'>
                <button
                  type='button'
                  onClick={handleRetryVnpay}
                  disabled={is_retry_loading}
                  className='rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#7c3aed]/20 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {is_retry_loading
                    ? 'Redirecting to VNPAY...'
                    : 'Pay again with VNPAY'}
                </button>
              </div>
            )}
          </section>

          <section className='mt-4 rounded-2xl border border-white/10 bg-white/5 p-6'>
            <h2 className='font-display text-sm font-semibold uppercase tracking-wider text-[#cbd5e1]'>
              Order items
            </h2>
            <ul className='mt-3 space-y-3'>
              {order_data.items.map(item_data => (
                <li
                  key={`${order_data.order_id}-${item_data.variant_id}`}
                  className='rounded-xl border border-white/10 bg-[#0f172a]/60 p-4'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-white'>
                        {item_data.product_name}
                      </p>
                      <p className='mt-1 text-xs text-[#94a3b8]'>
                        Qty: {item_data.quantity}
                      </p>
                      <p className='mt-1 text-xs text-[#94a3b8]'>
                        Unit: {formatVnd(item_data.price)}
                      </p>
                    </div>
                    <p className='text-sm font-semibold text-[#e2e8f0]'>
                      {formatVnd(item_data.subtotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-3'>
              <span className='text-sm text-[#94a3b8]'>Total</span>
              <span className='font-display text-lg font-bold text-white'>
                {formatVnd(order_data.total)}
              </span>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
