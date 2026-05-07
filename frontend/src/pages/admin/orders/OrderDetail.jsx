import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ConfirmDialog,
  StatusBadge,
  useAdminToast
} from '../../../components/admin/AdminUi.jsx'
import { adminOrderApi } from '../../../services/adminApi.js'
import { formatVnd } from '../../../utils/currency.js'
import { format_variant_label } from '../../../utils/variantDisplay.js'

const NEXT_STATUS_MAP = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['COMPLETED']
}

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy'
}

export default function OrderDetail() {
  const { id } = useParams()
  const { showError, showSuccess } = useAdminToast()
  const [order_data, setOrderData] = useState(null)
  const [is_loading, setIsLoading] = useState(true)
  const [is_updating, setIsUpdating] = useState(false)
  const [error_text, setErrorText] = useState('')
  const [pending_status, setPendingStatus] = useState('')

  const fetchOrderDetail = async () => {
    setIsLoading(true)
    setErrorText('')
    try {
      const response = await adminOrderApi.getById(id)
      setOrderData(response.data?.data || null)
    } catch (error) {
      const message = error.message || 'Không thể tải chi tiết đơn hàng'
      setErrorText(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const next_statuses = useMemo(() => {
    const current_status = order_data?.status
    return NEXT_STATUS_MAP[current_status] || []
  }, [order_data?.status])

  const handleUpdateStatus = async new_status => {
    setErrorText('')
    setIsUpdating(true)
    try {
      const response = await adminOrderApi.updateStatus(id, new_status)
      setOrderData(response.data?.data || null)
      showSuccess(
        `Đã cập nhật đơn hàng sang trạng thái ${
          STATUS_LABELS[new_status] || new_status
        }`
      )
    } catch (error) {
      const message = error.message || 'Không thể cập nhật trạng thái đơn hàng'
      setErrorText(message)
      showError(message)
    } finally {
      setIsUpdating(false)
      setPendingStatus('')
    }
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <div className='flex items-center justify-between'>
        <h1 className='font-display text-2xl font-bold text-white'>
          Chi tiết đơn hàng
        </h1>
        <Link
          to='/admin/orders'
          className='text-xs text-[#94a3b8] transition hover:text-white'
        >
          ← Quay lại danh sách đơn
        </Link>
      </div>

      {is_loading && (
        <div className='admin-card text-[#64748b]'>
          Đang tải chi tiết đơn hàng...
        </div>
      )}

      {!is_loading && error_text && (
        <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300'>
          {error_text}
        </div>
      )}

      {!is_loading && !error_text && order_data && (
        <>
          <div className='admin-card space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <p className='text-sm text-[#94a3b8]'>
                  Đơn #{order_data.order_id}
                </p>
                <p className='text-xs text-[#64748b]'>
                  {new Date(order_data.created_at).toLocaleString('vi-VN')}
                </p>
                <p className='mt-2 text-sm text-[#cbd5e1]'>
                  Người dùng: {order_data.user?.email || 'Chưa có'}
                </p>
                <p className='text-sm text-[#cbd5e1]'>
                  Địa chỉ: {order_data.address}
                </p>
              </div>
              <div className='text-right'>
                <div className='flex justify-end gap-2'>
                  <StatusBadge value={order_data.status} label='Đơn hàng' />
                </div>
                <div className='mt-2 flex justify-end gap-2'>
                  <StatusBadge
                    value={order_data.payments?.[0]?.method || 'N/A'}
                    label='Phương thức'
                  />
                  <StatusBadge
                    value={order_data.payments?.[0]?.status || 'PENDING'}
                    label='Thanh toán'
                  />
                </div>
                <p className='mt-1 text-base font-semibold text-emerald-400'>
                  {formatVnd(order_data.total)}
                </p>
              </div>
            </div>

            <div className='border-t border-white/10 pt-4'>
              <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                Cập nhật trạng thái
              </p>
              <div className='flex flex-wrap gap-2'>
                {next_statuses.length === 0 && (
                  <span className='text-sm text-[#64748b]'>
                    Không có trạng thái kế tiếp hợp lệ
                  </span>
                )}
                {next_statuses.map(status_value => (
                  <button
                    key={status_value}
                    onClick={() => setPendingStatus(status_value)}
                    disabled={is_updating}
                    className='rounded-lg border border-[#9f67ff]/40 bg-[#7c3aed]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#7c3aed]/20 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {is_updating
                      ? 'Đang cập nhật...'
                      : STATUS_LABELS[status_value] || status_value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='overflow-x-auto rounded-xl border border-white/10 bg-[#0d0d1a]/80 backdrop-blur'>
            <table className='w-full text-sm'>
              <thead className='border-b border-white/10 bg-white/5'>
                <tr>
                  <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                    Sản phẩm
                  </th>
                  <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                    Phân loại
                  </th>
                  <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                    SL
                  </th>
                  <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                    Đơn giá
                  </th>
                  <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/5'>
                {order_data.items.map(item_data => (
                  <tr key={`${item_data.order_id}-${item_data.variant_id}`}>
                    <td className='px-5 py-4 text-white'>
                      {item_data.variant?.product?.name || 'Chưa có'}
                    </td>
                    <td className='max-w-xs px-5 py-4 text-[#94a3b8]'>
                      <span className='block text-xs text-[#64748b]'>
                        #{item_data.variant_id}
                      </span>
                      <span className='mt-0.5 block text-sm text-[#cbd5e1]'>
                        {format_variant_label(item_data.variant)}
                      </span>
                    </td>
                    <td className='px-5 py-4 text-[#cbd5e1]'>{item_data.quantity}</td>
                    <td className='px-5 py-4 text-[#cbd5e1]'>
                      {formatVnd(item_data.price)}
                    </td>
                    <td className='px-5 py-4 text-emerald-400'>
                      {formatVnd(Number(item_data.price) * item_data.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <ConfirmDialog
        open={Boolean(pending_status)}
        title='Xác nhận cập nhật trạng thái'
        message={`Cập nhật đơn #${id} sang trạng thái ${
          STATUS_LABELS[pending_status] || pending_status
        }?`}
        confirm_text='Cập nhật'
        cancel_text='Hủy'
        on_cancel={() => setPendingStatus('')}
        on_confirm={() => handleUpdateStatus(pending_status)}
        is_loading={is_updating}
      />
    </div>
  )
}
