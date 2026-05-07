import { createContext, useContext, useMemo, useState } from 'react'

const STATUS_COLOR_MAP = {
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PROCESSING: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  SHIPPED: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  COMPLETED: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  FAILED: 'bg-red-500/15 text-red-300 border-red-500/30',
  CANCELLED: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  SUCCESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  COD: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  VNPAY: 'bg-violet-500/15 text-violet-300 border-violet-500/30'
}

const STATUS_LABEL_MAP = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  SUCCESS: 'Thành công',
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  METHOD: 'Phương thức',
  PAYMENT: 'Thanh toán',
  ORDER: 'Đơn hàng'
}

const TOAST_COLOR_MAP = {
  success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
  error: 'border-red-500/30 bg-red-500/15 text-red-200',
  info: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200'
}

const AdminToastContext = createContext(null)

export function StatusBadge({ value, label }) {
  const color_class =
    STATUS_COLOR_MAP[value] || 'bg-white/10 text-[#cbd5e1] border-white/20'
  const display_value = STATUS_LABEL_MAP[value] || value
  const display_label = label
    ? STATUS_LABEL_MAP[label.toUpperCase()] || label
    : ''

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${color_class}`}
    >
      {label ? `${display_label}: ${display_value}` : display_value}
    </span>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirm_text = 'Confirm',
  cancel_text = 'Cancel',
  on_confirm,
  on_cancel,
  is_loading = false
}) {
  if (!open) {
    return null
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4'>
      <div className='w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d1a] p-5'>
        <h3 className='font-display text-base font-bold text-white'>{title}</h3>
        <p className='mt-2 text-sm text-[#94a3b8]'>{message}</p>
        <div className='mt-5 flex justify-end gap-2'>
          <button
            type='button'
            onClick={on_cancel}
            disabled={is_loading}
            className='admin-btn-ghost text-xs'
          >
            {cancel_text}
          </button>
          <button
            type='button'
            onClick={on_confirm}
            disabled={is_loading}
            className='rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-200 transition hover:bg-red-500/25 disabled:opacity-60'
          >
            {is_loading ? 'Processing...' : confirm_text}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminToastProvider({ children }) {
  const [toast_list, setToastList] = useState([])

  const pushToast = (message, type = 'info') => {
    const toast_id = `${Date.now()}-${Math.random()}`
    const next_toast = {
      id: toast_id,
      message,
      type
    }

    setToastList(prev_list => [...prev_list, next_toast])
    setTimeout(() => {
      setToastList(prev_list =>
        prev_list.filter(toast_item => toast_item.id !== toast_id)
      )
    }, 2600)
  }

  const context_value = useMemo(
    () => ({
      showSuccess: message => pushToast(message, 'success'),
      showError: message => pushToast(message, 'error'),
      showInfo: message => pushToast(message, 'info')
    }),
    []
  )

  return (
    <AdminToastContext.Provider value={context_value}>
      {children}
      <div className='pointer-events-none fixed right-4 top-20 z-[70] space-y-2'>
        {toast_list.map(toast_item => (
          <div
            key={toast_item.id}
            className={`rounded-lg border px-4 py-2 text-sm shadow-lg ${TOAST_COLOR_MAP[toast_item.type] || TOAST_COLOR_MAP.info}`}
          >
            {toast_item.message}
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  )
}

export const useAdminToast = () => {
  const context_value = useContext(AdminToastContext)
  if (!context_value) {
    throw new Error('useAdminToast must be used within AdminToastProvider')
  }

  return context_value
}
