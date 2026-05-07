import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../../components/admin/AdminUi.jsx'
import { adminOrderApi } from '../../../services/adminApi.js'
import { formatVnd } from '../../../utils/currency.js'

const ORDER_STATUSES = [
  '',
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy'
}

export default function OrderList() {
  const [order_list, setOrderList] = useState([])
  const [pagination_data, setPaginationData] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  })
  const [filter_data, setFilterData] = useState({
    status: '',
    start_date: '',
    end_date: ''
  })
  const [is_loading, setIsLoading] = useState(false)

  const fetchOrders = useCallback(
    async page_number => {
      setIsLoading(true)
      try {
        const response = await adminOrderApi.getOrders({
          page: page_number,
          limit: pagination_data.limit,
          ...(filter_data.status && { status: filter_data.status }),
          ...(filter_data.start_date && { start_date: filter_data.start_date }),
          ...(filter_data.end_date && { end_date: filter_data.end_date })
        })
        const response_data = response.data?.data
        setOrderList(response_data?.items || [])
        setPaginationData(prev_data => ({
          ...prev_data,
          page: response_data?.page || 1,
          limit: response_data?.limit || 10,
          total: response_data?.total || 0,
          total_pages: response_data?.total_pages || 1
        }))
      } catch {
        setOrderList([])
      } finally {
        setIsLoading(false)
      }
    },
    [filter_data, pagination_data.limit]
  )

  useEffect(() => {
    fetchOrders(1)
  }, [fetchOrders])

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold text-white'>
            Đơn hàng
          </h1>
          <p className='text-sm text-[#64748b]'>
            Tổng cộng {pagination_data.total} đơn hàng
          </p>
        </div>
      </div>

      <div className='admin-card'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div>
            <label className='admin-label'>Trạng thái</label>
            <select
              value={filter_data.status}
              onChange={event =>
                setFilterData(prev_data => ({
                  ...prev_data,
                  status: event.target.value
                }))
              }
              className='admin-select w-full'
            >
              {ORDER_STATUSES.map(status_value => (
                <option key={status_value || 'all'} value={status_value}>
                  {status_value ? STATUS_LABELS[status_value] : 'Tất cả'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='admin-label'>Từ ngày</label>
            <input
              type='date'
              value={filter_data.start_date}
              onChange={event =>
                setFilterData(prev_data => ({
                  ...prev_data,
                  start_date: event.target.value
                }))
              }
              className='admin-input w-full'
            />
          </div>
          <div>
            <label className='admin-label'>Đến ngày</label>
            <input
              type='date'
              value={filter_data.end_date}
              onChange={event =>
                setFilterData(prev_data => ({
                  ...prev_data,
                  end_date: event.target.value
                }))
              }
              className='admin-input w-full'
            />
          </div>
        </div>
      </div>

      <div className='overflow-x-auto rounded-xl border border-white/10 bg-[#0d0d1a]/80 backdrop-blur'>
        <table className='w-full text-sm'>
          <thead className='border-b border-white/10 bg-white/5'>
            <tr>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Đơn hàng
              </th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Người dùng
              </th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Trạng thái
              </th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Thanh toán
              </th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Tổng tiền
              </th>
              <th className='px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {is_loading ? (
              <tr>
                <td colSpan={6} className='px-5 py-12 text-center text-[#64748b]'>
                  Đang tải...
                </td>
              </tr>
            ) : order_list.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-5 py-12 text-center text-[#64748b]'>
                  Không tìm thấy đơn hàng
                </td>
              </tr>
            ) : (
              order_list.map(order_data => (
                <tr
                  key={order_data.order_id}
                  className='transition hover:bg-white/[0.03]'
                >
                  <td className='px-5 py-4 text-white'>
                    #{order_data.order_id}
                    <p className='text-xs text-[#64748b]'>
                      {new Date(order_data.created_at).toLocaleString('vi-VN')}
                    </p>
                  </td>
                  <td className='px-5 py-4 text-[#94a3b8]'>
                    {order_data.user?.email ||
                      order_data.user?.username ||
                      'Chưa có'}
                  </td>
                  <td className='px-5 py-4'>
                    <StatusBadge value={order_data.status} />
                  </td>
                  <td className='px-5 py-4 text-[#cbd5e1]'>
                    <div className='flex flex-wrap gap-1'>
                      <StatusBadge value={order_data.payments?.[0]?.method || 'N/A'} />
                      <StatusBadge
                        value={order_data.payments?.[0]?.status || 'PENDING'}
                      />
                    </div>
                  </td>
                  <td className='px-5 py-4 text-emerald-400'>
                    {formatVnd(order_data.total)}
                  </td>
                  <td className='px-5 py-4 text-right'>
                    <Link
                      to={`/admin/orders/${order_data.order_id}`}
                      className='rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#94a3b8] transition hover:border-[#9f67ff]/50 hover:text-white'
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination_data.total_pages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={() => fetchOrders(pagination_data.page - 1)}
            disabled={pagination_data.page <= 1}
            className='admin-btn-ghost text-xs disabled:opacity-30'
          >
            ← Trước
          </button>
          <span className='px-3 text-sm text-[#94a3b8]'>
            Trang {pagination_data.page}/{pagination_data.total_pages}
          </span>
          <button
            onClick={() => fetchOrders(pagination_data.page + 1)}
            disabled={pagination_data.page >= pagination_data.total_pages}
            className='admin-btn-ghost text-xs disabled:opacity-30'
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
