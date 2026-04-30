import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminUserApi } from '../../../services/adminApi.js'

export default function UserDetail() {
  const { id } = useParams()
  const [user_data, setUserData] = useState(null)
  const [is_loading, setIsLoading] = useState(true)
  const [error_message, setErrorMessage] = useState('')

  useEffect(() => {
    const fetch_detail = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await adminUserApi.getUserById(id)
        setUserData(response.data.data || null)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetch_detail()
  }, [id])

  if (is_loading) {
    return (
      <section className='mx-auto w-full max-w-7xl px-4 py-6 text-white'>
        Loading user detail...
      </section>
    )
  }

  if (error_message) {
    return (
      <section className='mx-auto w-full max-w-7xl px-4 py-6 text-white'>
        <p className='rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
          {error_message}
        </p>
      </section>
    )
  }

  if (!user_data) {
    return null
  }

  return (
    <section className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 text-white'>
      <header className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>User Detail</h1>
        <Link to='/admin/users' className='text-sm text-[#94a3b8] hover:text-white'>
          Back to users
        </Link>
      </header>

      <article className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
        <h2 className='mb-3 text-lg font-medium'>Profile</h2>
        <p className='text-sm text-[#cbd5e1]'>Username: {user_data.username}</p>
        <p className='text-sm text-[#cbd5e1]'>Email: {user_data.email}</p>
        <p className='text-sm text-[#cbd5e1]'>Status: {user_data.status}</p>
        <p className='text-sm text-[#cbd5e1]'>
          Roles: {(user_data.roles || []).join(', ') || 'N/A'}
        </p>
      </article>

      <article className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
        <h2 className='mb-3 text-lg font-medium'>Orders</h2>
        {!user_data.orders?.length ? (
          <p className='text-sm text-[#94a3b8]'>No orders</p>
        ) : (
          <div className='space-y-3'>
            {user_data.orders.map(order_item => (
              <div
                key={order_item.order_id}
                className='rounded-lg border border-white/10 p-3'
              >
                <p className='text-sm text-[#cbd5e1]'>
                  Order #{order_item.order_id} - {order_item.status}
                </p>
                <p className='text-xs text-[#94a3b8]'>
                  Total: {String(order_item.total)} | Paid:{' '}
                  {order_item.is_paid ? 'Yes' : 'No'}
                </p>
                <p className='mt-1 text-xs text-[#94a3b8]'>
                  Payments:{' '}
                  {order_item.payments?.length
                    ? order_item.payments
                        .map(payment_item => payment_item.method)
                        .join(', ')
                    : 'None'}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
