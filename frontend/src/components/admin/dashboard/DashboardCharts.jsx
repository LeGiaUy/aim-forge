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

const ChartCard = ({ title, children }) => (
  <article className='rounded-xl border border-white/10 bg-[#101225] p-4 shadow-lg'>
    <h2 className='text-base font-semibold text-white'>{title}</h2>
    <div className='mt-4 h-72'>{children}</div>
  </article>
)

export default function DashboardCharts({
  revenue_chart_data,
  order_status_data,
  top_products_data,
  payment_method_data
}) {
  return (
    <section className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      <ChartCard title='Revenue Over Time'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={revenue_chart_data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
            <XAxis dataKey='date' stroke='#94a3b8' />
            <YAxis stroke='#94a3b8' />
            <Tooltip />
            <Legend />
            <Line
              type='monotone'
              dataKey='revenue'
              stroke='#60a5fa'
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Order Status Distribution'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={order_status_data}
              dataKey='count'
              nameKey='status'
              outerRadius={100}
            >
              {order_status_data.map((entry_item, index_value) => (
                <Cell
                  key={`${entry_item.status}-${index_value}`}
                  fill={PIE_COLORS[index_value % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Top Products'>
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
            />
            <YAxis stroke='#94a3b8' />
            <Tooltip />
            <Legend />
            <Bar dataKey='quantity' fill='#34d399' />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Payment Method'>
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
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  )
}
