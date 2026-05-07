import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminUserApi } from '../../../services/adminApi.js'

const USER_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Không hoạt động',
  BANNED: 'Bị khóa'
}

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
        Đang tải chi tiết người dùng...
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
        <h1 className='text-2xl font-semibold'>Chi tiết người dùng</h1>
        <Link to='/admin/users' className='text-sm text-[#94a3b8] hover:text-white'>
          Quay lại danh sách người dùng
        </Link>
      </header>

      <article className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
        <h2 className='mb-3 text-lg font-medium'>Hồ sơ</h2>
        <p className='text-sm text-[#cbd5e1]'>Tên người dùng: {user_data.username}</p>
        <p className='text-sm text-[#cbd5e1]'>Email: {user_data.email}</p>
        <p className='text-sm text-[#cbd5e1]'>
          Trạng thái: {USER_STATUS_LABELS[user_data.status] || user_data.status}
        </p>
        <p className='text-sm text-[#cbd5e1]'>
          Vai trò: {(user_data.roles || []).join(', ') || 'Chưa có'}
        </p>
      </article>

      <article className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
        <h2 className='mb-3 text-lg font-medium'>Đơn hàng</h2>
        {!user_data.orders?.length ? (
          <p className='text-sm text-[#94a3b8]'>Chưa có đơn hàng</p>
        ) : (
          <div className='space-y-3'>
            {user_data.orders.map(order_item => (
              <div
                key={order_item.order_id}
                className='rounded-lg border border-white/10 p-3'
              >
                <p className='text-sm text-[#cbd5e1]'>
                  Đơn #{order_item.order_id} - {order_item.status}
                </p>
                <p className='text-xs text-[#94a3b8]'>
                  Tổng tiền: {String(order_item.total)} | Đã thanh toán:{' '}
                  {order_item.is_paid ? 'Có' : 'Không'}
                </p>
                <p className='mt-1 text-xs text-[#94a3b8]'>
                  Phương thức thanh toán:{' '}
                  {order_item.payments?.length
                    ? order_item.payments
                        .map(payment_item => payment_item.method)
                        .join(', ')
                    : 'Không có'}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
