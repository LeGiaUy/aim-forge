/** Chuỗi YYYY-MM-DD → Date (giờ địa phương 00:00) */
export const parse_ymd = ymd_value => {
  const text = String(ymd_value ?? '').trim()
  if (!text) return undefined
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

/** Date → YYYY-MM-DD */
export const format_ymd = date_value => {
  if (!date_value || Number.isNaN(date_value.getTime())) return ''
  const year = date_value.getFullYear()
  const month = String(date_value.getMonth() + 1).padStart(2, '0')
  const day = String(date_value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Hiển thị dd/MM/yyyy cho người dùng */
export const display_date_vi = ymd_value => {
  const parsed = parse_ymd(ymd_value)
  if (!parsed) return ''
  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${day}/${month}/${year}`
}

/** datetime-local → { date, time } */
export const split_datetime_local = value => {
  const text = String(value ?? '').trim()
  if (!text) return { date: '', time: '' }
  const [date_part, time_part] = text.split('T')
  return {
    date: date_part || '',
    time: (time_part || '').slice(0, 5),
  }
}

/** Gộp date + time → datetime-local */
export const merge_datetime_local = (date_part, time_part) => {
  const date_text = String(date_part ?? '').trim()
  if (!date_text) return ''
  const time_text = String(time_part ?? '').trim() || '00:00'
  return `${date_text}T${time_text}`
}
