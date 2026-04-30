const format_currency = value =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value || 0)

const format_percent = value => `${Number(value || 0).toFixed(2)}%`

const KPI_CARD_LIST = [
  {
    key: 'revenue',
    label: 'Revenue',
    formatter: format_currency
  },
  {
    key: 'totalOrders',
    label: 'Orders',
    formatter: value => value || 0
  },
  {
    key: 'conversionRate',
    label: 'Conversion Rate',
    formatter: format_percent
  },
  {
    key: 'aov',
    label: 'AOV',
    formatter: format_currency
  }
]

export default function KpiCards({ kpi_data }) {
  return (
    <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {KPI_CARD_LIST.map(card_item => (
        <article
          key={card_item.key}
          className='rounded-xl border border-white/10 bg-[#101225] p-4 shadow-lg'
        >
          <p className='text-sm text-slate-400'>{card_item.label}</p>
          <p className='mt-2 text-2xl font-bold text-white'>
            {card_item.formatter(kpi_data?.[card_item.key])}
          </p>
        </article>
      ))}
    </section>
  )
}
