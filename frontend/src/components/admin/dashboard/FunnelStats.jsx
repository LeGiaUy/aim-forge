const format_percent = value => `${Number(value || 0).toFixed(2)}%`

const get_drop_percent = (current_value, next_value) => {
  if (!current_value) {
    return 0
  }

  return Number((((current_value - next_value) / current_value) * 100).toFixed(2))
}

const STEP_CONFIG = [
  { key: 'created', label: 'Đã tạo' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'completed', label: 'Hoàn tất' }
]

export default function FunnelStats({ funnel_data }) {
  const created_count = funnel_data?.created || 0
  const paid_count = funnel_data?.paid || 0
  const completed_count = funnel_data?.completed || 0

  const drop_created_to_paid = get_drop_percent(created_count, paid_count)
  const drop_paid_to_completed = get_drop_percent(paid_count, completed_count)

  return (
    <section className='rounded-xl border border-white/10 bg-[#101225] p-4 shadow-lg'>
      <h2 className='text-base font-semibold text-white'>Phễu chuyển đổi</h2>

      <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
        {STEP_CONFIG.map(step_item => (
          <article
            key={step_item.key}
            className='rounded-lg border border-white/10 bg-[#0b0d1d] p-4'
          >
            <p className='text-xs uppercase tracking-wider text-slate-400'>
              {step_item.label}
            </p>
            <p className='mt-2 text-2xl font-bold text-white'>
              {funnel_data?.[step_item.key] || 0}
            </p>
          </article>
        ))}
      </div>

      <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-2'>
        <p className='rounded-lg border border-white/10 bg-[#0b0d1d] p-3 text-sm text-slate-300'>
          Đã tạo → Đã thanh toán:{' '}
          {format_percent(funnel_data?.conversion?.createdToPaid)}
          {' '}| Hủy: {format_percent(drop_created_to_paid)}
        </p>
        <p className='rounded-lg border border-white/10 bg-[#0b0d1d] p-3 text-sm text-slate-300'>
          Đã thanh toán → Hoàn tất:{' '}
          {format_percent(funnel_data?.conversion?.paidToCompleted)}
          {' '}| Hủy:{' '}
          {format_percent(drop_paid_to_completed)}
        </p>
      </div>
    </section>
  )
}
