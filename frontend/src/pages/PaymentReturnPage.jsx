import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paymentApi } from '../services/api.js'

export default function PaymentReturnPage() {
  const [search_params] = useSearchParams()
  const [loading_data, setLoadingData] = useState(true)
  const [return_data, setReturnData] = useState(null)
  const [error_message, setErrorMessage] = useState('')

  useEffect(() => {
    const fetch_return_result = async () => {
      setLoadingData(true)
      setErrorMessage('')

      try {
        const params_object = Object.fromEntries(search_params.entries())
        const response = await paymentApi.getVnpayReturn(params_object)
        setReturnData(response.data?.data || null)
      } catch (error) {
        setErrorMessage(error.message || 'Cannot verify payment return')
      } finally {
        setLoadingData(false)
      }
    }

    fetch_return_result()
  }, [search_params])

  const raw_status = String(return_data?.status || '').toLowerCase()
  const status_label =
    raw_status === 'success'
      ? 'Thành công'
      : raw_status === 'failed'
        ? 'Thất bại'
        : raw_status === 'pending'
          ? 'Đang xử lý'
          : return_data?.status || 'Không xác định'

  return (
    <main className='mx-auto min-h-screen max-w-3xl px-6 pb-16 pt-28'>
      <section className='rounded-2xl border border-white/10 bg-white/5 p-6'>
        <h1 className='font-display text-xl font-bold uppercase tracking-wider text-white'>
          Kết quả thanh toán
        </h1>

        {loading_data && (
          <p className='mt-4 text-sm text-[#94a3b8]'>Đang kiểm tra giao dịch...</p>
        )}

        {!loading_data && error_message && (
          <p className='mt-4 text-sm font-semibold text-red-300'>{error_message}</p>
        )}

        {!loading_data && return_data && (
          <div className='mt-4 space-y-2 text-sm text-[#cbd5e1]'>
            <p>
              Trạng thái:{' '}
              <span className='font-semibold text-white'>{status_label}</span>
            </p>
            <p>Mã đơn hàng: {return_data.order_id || 'Không có'}</p>
            <p>Mã giao dịch: {return_data.transaction_id || 'Không có'}</p>
            <p>Mã phản hồi: {return_data.response_code || 'Không có'}</p>
          </div>
        )}

        <div className='mt-6 flex gap-3'>
          <Link
            to='/profile'
            className='rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] transition hover:bg-white/10'
          >
            Xem hồ sơ
          </Link>
          <Link
            to='/'
            className='rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#7c3aed]/20'
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  )
}
