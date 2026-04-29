import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderApi } from '../services/api.js'
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

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [order_list, setOrderList] = useState([])
  const [is_loading_orders, setIsLoadingOrders] = useState(false)
  const [order_error_text, setOrderErrorText] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoadingOrders(true)
      setOrderErrorText('')

      try {
        const response = await orderApi.getOrders()
        setOrderList(response.data?.data || [])
      } catch (error) {
        setOrderErrorText(error.message || 'Cannot load orders')
      } finally {
        setIsLoadingOrders(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <main className='mx-auto min-h-screen max-w-4xl px-6 pb-12 pt-28'>
      <section className='glass-card rounded-2xl p-6'>
        <h1 className='font-display text-2xl font-bold uppercase text-white'>
          My account
        </h1>
        <p className='mt-2 text-sm text-[#94a3b8]'>
          Signed in as {user?.username || user?.email}
        </p>

        <div className='mt-6 space-y-2 text-sm text-[#cbd5e1]'>
          <p>Username: {user?.username || 'N/A'}</p>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>User ID: {user?.user_id || 'N/A'}</p>
        </div>

        <button
          type='button'
          onClick={logout}
          className='mt-6 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-display uppercase tracking-wider text-red-300 transition hover:bg-red-500/20'
        >
          Logout
        </button>
      </section>

      <section className='mt-6 rounded-2xl border border-white/10 bg-white/5 p-6'>
        <header className='flex items-center justify-between gap-4'>
          <h2 className='font-display text-lg font-bold uppercase tracking-wider text-white'>
            My orders
          </h2>
          <span className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
            {order_list.length} order(s)
          </span>
        </header>

        {is_loading_orders && (
          <p className='mt-4 text-sm text-[#94a3b8]'>Loading orders...</p>
        )}

        {!is_loading_orders && order_error_text && (
          <p className='mt-4 text-sm font-semibold text-red-300'>
            {order_error_text}
          </p>
        )}

        {!is_loading_orders && !order_error_text && order_list.length === 0 && (
          <p className='mt-4 text-sm text-[#94a3b8]'>
            You have no orders yet. Create your first order from cart.
          </p>
        )}

        {!is_loading_orders && !order_error_text && order_list.length > 0 && (
          <ul className='mt-4 space-y-3'>
            {order_list.map(order_data => (
              <li
                key={order_data.order_id}
                className='rounded-xl border border-white/10 bg-[#0f172a]/60 p-4'
              >
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <p className='font-display text-sm font-semibold uppercase tracking-wider text-white'>
                      Order #{order_data.order_id}
                    </p>
                    <p className='mt-1 text-xs text-[#94a3b8]'>
                      {new Date(order_data.created_at).toLocaleString('vi-VN')}
                    </p>
                    <p className='mt-1 text-sm text-[#cbd5e1]'>
                      {order_data.address}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <StatusBadge
                      label_text='Order'
                      status_value={order_data.status}
                    />
                    <StatusBadge
                      label_text='Payment'
                      status_value={order_data.payment_status}
                      type_value='payment'
                    />
                  </div>
                </div>

                <div className='mt-3 flex items-center justify-between border-t border-white/10 pt-3'>
                  <p className='text-sm text-[#94a3b8]'>
                    {order_data.items.length} item(s)
                  </p>
                  <p className='font-display text-base font-bold text-white'>
                    {formatVnd(order_data.total)}
                  </p>
                </div>

                <ul className='mt-3 space-y-1'>
                  {order_data.items.slice(0, 3).map(item_data => (
                    <li
                      key={`${order_data.order_id}-${item_data.variant_id}`}
                      className='flex items-center justify-between text-sm text-[#cbd5e1]'
                    >
                      <span className='truncate pr-4'>{item_data.product_name}</span>
                      <span>x{item_data.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className='mt-3 border-t border-white/10 pt-3'>
                  <Link
                    to={`/profile/orders/${order_data.order_id}`}
                    className='text-xs font-semibold uppercase tracking-wider text-[#a78bfa] transition hover:text-[#c4b5fd]'
                  >
                    View details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
