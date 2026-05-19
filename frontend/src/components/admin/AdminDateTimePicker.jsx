import AdminDatePicker from './AdminDatePicker.jsx'
import { merge_datetime_local, split_datetime_local } from '../../utils/adminDate.js'

/**
 * DatePicker + giờ — giá trị datetime-local (YYYY-MM-DDTHH:mm)
 */
export default function AdminDateTimePicker({
  label_text,
  value = '',
  on_change,
  min,
  max,
  class_name = '',
  clearable = true,
}) {
  const { date: date_part, time: time_part } = split_datetime_local(value)

  const handle_date_change = next_date => {
    if (!next_date) {
      on_change('')
      return
    }
    on_change(merge_datetime_local(next_date, time_part || '00:00'))
  }

  const handle_time_change = event => {
    if (!date_part) return
    const next_time = event.target.value
    on_change(merge_datetime_local(date_part, next_time))
  }

  const min_date = min ? String(min).slice(0, 10) : undefined
  const max_date = max ? String(max).slice(0, 10) : undefined

  return (
    <div className={`space-y-2 ${class_name}`}>
      <AdminDatePicker
        label_text={label_text}
        value={date_part}
        on_change={handle_date_change}
        min={min_date}
        max={max_date}
        clearable={clearable}
        placeholder='Chọn ngày'
      />
      <div>
        <label className='admin-label mb-1 block'>Giờ</label>
        <input
          type='time'
          value={time_part}
          disabled={!date_part}
          onChange={handle_time_change}
          className='admin-input w-full disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={`${label_text || 'Thời gian'} — giờ`}
        />
      </div>
    </div>
  )
}
