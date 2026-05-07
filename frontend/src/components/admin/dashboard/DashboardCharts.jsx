import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const PIE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa']
const MAX_LABEL_LENGTH = 20
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: '#0b0d1d',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '10px'
}
const TOOLTIP_LABEL_STYLE = { color: '#e2e8f0' }
const TOOLTIP_ITEM_STYLE = { color: '#cbd5e1' }
const format_count_tooltip = value => [value, 'Số lượng']
const format_revenue_tooltip = value => [value, 'Doanh thu']
const STATUS_LABEL_MAP = {
  canceled: 'Đã hủy',
  cancelled: 'Đã hủy',
  cancel: 'Đã hủy',
  paid: 'Đã thanh toán',
  completed: 'Hoàn tất',
  pending: 'Chờ xử lý'
}

const translate_status_label = status_value => {
  const safe_status = String(status_value || '').trim().toLowerCase()
  return STATUS_LABEL_MAP[safe_status] || status_value || 'Không xác định'
}

const truncate_label = label_value => {
  const safe_label = String(label_value || '')
  if (safe_label.length <= MAX_LABEL_LENGTH) {
    return safe_label
  }

  return `${safe_label.slice(0, MAX_LABEL_LENGTH)}...`
}

const ChartCard = ({ title, children, body_class_name = 'h-72' }) => (
  <article className='rounded-xl border border-white/10 bg-[#101225] p-4 shadow-lg'>
    <h2 className='text-base font-semibold text-white'>{title}</h2>
    <div className={`mt-4 ${body_class_name}`}>{children}</div>
  </article>
)

export default function DashboardCharts({
  revenue_chart_data,
  order_status_data,
  top_products_data,
  payment_method_data
}) {
  const translated_order_status_data = order_status_data.map(item_data => ({
    ...item_data,
    status: translate_status_label(item_data.status)
  }))

  return (
    <section className='space-y-4'>
      <ChartCard title='Top sản phẩm' body_class_name='h-96'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={top_products_data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
            <XAxis
              dataKey='productName'
              stroke='#94a3b8'
              interval={0}
              angle={-20}
              textAnchor='end'
              height={72}
              tickFormatter={truncate_label}
            />
            <YAxis stroke='#94a3b8' />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={format_count_tooltip}
            />
            <Legend />
            <Bar dataKey='quantity' name='Số lượng' fill='#34d399' />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Doanh thu theo thời gian'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={revenue_chart_data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
            <XAxis dataKey='date' stroke='#94a3b8' />
            <YAxis stroke='#94a3b8' />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={format_revenue_tooltip}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='revenue'
              name='Doanh thu'
              stroke='#60a5fa'
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <ChartCard title='Phân bố trạng thái đơn hàng'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={translated_order_status_data}
                dataKey='count'
                nameKey='status'
                outerRadius={100}
              >
                {translated_order_status_data.map((entry_item, index_value) => (
                  <Cell
                    key={`${entry_item.status}-${index_value}`}
                    fill={PIE_COLORS[index_value % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={format_count_tooltip}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Phương thức thanh toán'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={payment_method_data}
                dataKey='count'
                nameKey='method'
                outerRadius={100}
              >
                {payment_method_data.map((entry_item, index_value) => (
                  <Cell
                    key={`${entry_item.method}-${index_value}`}
                    fill={PIE_COLORS[index_value % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={format_count_tooltip}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  )
}
