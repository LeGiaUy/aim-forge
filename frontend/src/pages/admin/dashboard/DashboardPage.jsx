import { useEffect, useMemo, useState } from 'react'
import DashboardCharts from '../../../components/admin/dashboard/DashboardCharts.jsx'
import FunnelStats from '../../../components/admin/dashboard/FunnelStats.jsx'
import KpiCards from '../../../components/admin/dashboard/KpiCards.jsx'
import { adminStatsApi } from '../../../services/adminApi.js'

const to_iso_start = date_value => {
  if (!date_value) {
    return undefined
  }

  const parsed_date = new Date(date_value)
  parsed_date.setHours(0, 0, 0, 0)
  return parsed_date.toISOString()
}

const to_iso_end = date_value => {
  if (!date_value) {
    return undefined
  }

  const parsed_date = new Date(date_value)
  parsed_date.setHours(23, 59, 59, 999)
  return parsed_date.toISOString()
}

const get_error_message = error_value => {
  return (
    error_value?.response?.data?.message ||
    error_value?.message ||
    'Không thể tải dữ liệu tổng quan'
  )
}

export default function DashboardPage() {
  const [from_date, setFromDate] = useState('')
  const [to_date, setToDate] = useState('')
  const [group_by, setGroupBy] = useState('day')
  const [is_loading, setIsLoading] = useState(true)
  const [error_message, setErrorMessage] = useState('')
  const [kpi_data, setKpiData] = useState({})
  const [revenue_chart_data, setRevenueChartData] = useState([])
  const [order_status_data, setOrderStatusData] = useState([])
  const [top_products_data, setTopProductsData] = useState([])
  const [payment_method_data, setPaymentMethodData] = useState([])
  const [funnel_data, setFunnelData] = useState({})

  const query_params = useMemo(() => {
    return {
      from: to_iso_start(from_date),
      to: to_iso_end(to_date)
    }
  }, [from_date, to_date])

  useEffect(() => {
    const fetch_dashboard_data = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [
          kpi_response,
          revenue_response,
          order_status_response,
          top_products_response,
          payment_method_response,
          funnel_response
        ] = await Promise.all([
          adminStatsApi.getKpi(query_params),
          adminStatsApi.getRevenueChart({
            ...query_params,
            groupBy: group_by
          }),
          adminStatsApi.getOrderStatus(query_params),
          adminStatsApi.getTopProducts(query_params),
          adminStatsApi.getPaymentMethod(query_params),
          adminStatsApi.getFunnel(query_params)
        ])

        setKpiData(kpi_response?.data?.data || {})
        setRevenueChartData(revenue_response?.data?.data || [])
        setOrderStatusData(order_status_response?.data?.data || [])
        setTopProductsData(top_products_response?.data?.data || [])
        setPaymentMethodData(payment_method_response?.data?.data || [])
        setFunnelData(funnel_response?.data?.data || {})
      } catch (error) {
        setErrorMessage(get_error_message(error))
      } finally {
        setIsLoading(false)
      }
    }

    fetch_dashboard_data()
  }, [group_by, query_params])

  return (
    <section className='mx-auto w-full max-w-7xl space-y-4 px-4 py-5 lg:px-6'>
      <header className='flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101225] p-4 shadow-lg lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Tổng quan quản trị</h1>
          <p className='mt-1 text-sm text-slate-400'>
            Thống kê vận hành thương mại điện tử theo thời gian thực
          </p>
        </div>

        <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
          <label className='text-xs text-slate-300'>
            Từ ngày
            <input
              type='date'
              value={from_date}
              onChange={event_data => setFromDate(event_data.target.value)}
              className='mt-1 w-full rounded-lg border border-white/15 bg-[#0b0d1d] px-3 py-2 text-sm text-white outline-none focus:border-violet-400'
            />
          </label>
          <label className='text-xs text-slate-300'>
            Đến ngày
            <input
              type='date'
              value={to_date}
              onChange={event_data => setToDate(event_data.target.value)}
              className='mt-1 w-full rounded-lg border border-white/15 bg-[#0b0d1d] px-3 py-2 text-sm text-white outline-none focus:border-violet-400'
            />
          </label>
          <label className='text-xs text-slate-300'>
            Nhóm theo
            <select
              value={group_by}
              onChange={event_data => setGroupBy(event_data.target.value)}
              className='mt-1 w-full rounded-lg border border-white/15 bg-[#0b0d1d] px-3 py-2 text-sm text-white outline-none focus:border-violet-400'
            >
              <option value='day'>Ngày</option>
              <option value='month'>Tháng</option>
            </select>
          </label>
        </div>
      </header>

      {is_loading && (
        <p className='rounded-xl border border-white/10 bg-[#101225] p-4 text-sm text-slate-300'>
          Đang tải dữ liệu tổng quan...
        </p>
      )}

      {!!error_message && (
        <p className='rounded-xl border border-red-500/30 bg-red-500/15 p-4 text-sm text-red-200'>
          {error_message}
        </p>
      )}

      {!is_loading && !error_message && (
        <>
          <KpiCards kpi_data={kpi_data} />
          <DashboardCharts
            revenue_chart_data={revenue_chart_data}
            order_status_data={order_status_data}
            top_products_data={top_products_data}
            payment_method_data={payment_method_data}
          />
          <FunnelStats funnel_data={funnel_data} />
        </>
      )}
    </section>
  )
}
